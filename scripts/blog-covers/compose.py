# /// script
# requires-python = ">=3.10"
# dependencies = ["Pillow==12.1.1"]
# ///
"""Build localized 1200 × 800 blog covers from the manifest and transparent artwork."""

import argparse
import hashlib
from io import BytesIO
import json
from pathlib import Path
import shutil
import subprocess
from tempfile import TemporaryDirectory
from urllib.request import urlopen

from PIL import Image, ImageDraw, ImageFont


SOURCE = Path(__file__).resolve().parent
FONT_URL = "https://github.com/CyanoHao/Resource-Han-Rounded/releases/download/v0.990/RHR-CN-0.990.7z"
ARCHIVE_SHA256 = "e7005f7b4a7a0b8352d32c4a1358ff47564eb73be7fdb2db00d9f792755e9dc7"
FONT_NAME = "ResourceHanRoundedCN-Heavy.ttf"
FONT_SHA256 = "dfc757d9c5ae597cac15b12a51a1cee07af500cc8cf7439b243e1bb94b2b1f83"
BYTE_LIMIT = 150_000
SIZE = (1200, 800)
MIN_INK_HEIGHT = 90
MIN_SIDE_HEIGHT = 144
INK_COVERAGE = 128
PALETTES = {
    # Ground: first-line ink, second-line panel, second-line ink.
    "#53E3B4": ("#151B36", "#2336BB", "#FFFFFF"),
    "#FF7894": ("#231732", "#9B123F", "#FFFFFF"),
    "#484ADC": ("#FFF8EA", "#FF9D27", "#17163C"),
    "#69D9F7": ("#162039", "#5227AE", "#FFFFFF"),
    "#1A1740": ("#FFF13E", "#4CEAFF", "#151B36"),
}
# Artwork box and the two type boxes, with each box's horizontal alignment.
# Type boxes describe the ink. The reverse panel extends slightly beyond line two.
LAYOUTS = {
    "Wide group below": (
        (58, 365, 1142, 782, "center"),
        (58, 34, 1068, 180, "left"), (82, 200, 1092, 346, "left"),
    ),
    "Oversized prop": (
        (33, 344, 1167, 790, "center"),
        (95, 25, 1105, 161, "center"), (95, 178, 1105, 314, "center"),
    ),
    "Host left": (
        (24, 40, 615, 556, "left"),
        (626, 200, 1150, 364, "right"), (140, 590, 1150, 754, "right"),
    ),
    "Host right": (
        (598, 264, 1176, 786, "right"),
        (50, 46, 1060, 210, "left"), (50, 350, 574, 514, "left"),
    ),
}
# Put the long line on the full-width rail when it would otherwise sit beside the duck.
SIDE_ALTERNATES = {
    "Host left": (0, (
        (24, 264, 602, 786, "left"),
        (140, 46, 1150, 210, "right"), (626, 350, 1150, 514, "right"),
    )),
    "Host right": (1, (
        (585, 40, 1176, 556, "right"),
        (50, 200, 574, 364, "left"), (50, 590, 1060, 754, "left"),
    )),
}
# Move both lines together when the side slot would make either one too small.
SIDE_STACKS = {
    "Host left": (
        (18, 16, 1134, 482, "center"),
        (70, 503, 1150, 629, "right"), (70, 647, 1150, 773, "right"),
    ),
    "Host right": (
        (66, 313, 1184, 787, "center"),
        (50, 24, 1130, 150, "left"), (74, 168, 1154, 294, "left"),
    ),
}


def digest(path):
    with path.open("rb") as stream:
        sha = hashlib.sha256()
        while chunk := stream.read(1024 * 1024):
            sha.update(chunk)
    return sha.hexdigest()


def cached_font():
    cache = SOURCE / ".font-cache"
    font = cache / FONT_NAME
    if font.is_file() and digest(font) == FONT_SHA256:
        return font

    extractor = shutil.which("7zz") or shutil.which("7z")
    if extractor is None:
        raise RuntimeError("Install 7-Zip (7zz or 7z) to unpack the pinned font.")

    cache.mkdir(exist_ok=True)
    with TemporaryDirectory(dir=cache) as directory:
        archive = Path(directory) / "rounded.7z"
        unpacked = Path(directory) / FONT_NAME
        with urlopen(FONT_URL, timeout=60) as response, archive.open("wb") as output:
            shutil.copyfileobj(response, output)
        if digest(archive) != ARCHIVE_SHA256:
            raise ValueError("The downloaded font archive failed its SHA-256 check.")
        with unpacked.open("wb") as output:
            subprocess.run([extractor, "x", "-so", str(archive), FONT_NAME],
                           stdout=output, check=True)
        if digest(unpacked) != FONT_SHA256:
            raise ValueError("The extracted font failed its SHA-256 check.")
        unpacked.replace(font)
    return font


def left_edge(left, right, width, alignment):
    if alignment == "right":
        return right - width
    if alignment == "center":
        return (left + right - width) // 2
    return left


def glyph_mask(font, text, locale):
    # The CN font uses a full-width curly apostrophe and a Latin-width straight one.
    if locale == "en":
        text = text.replace("’", "'")
    x0, y0, x1, y1 = font.getbbox(text)
    mask = Image.new("L", (x1 - x0, y1 - y0))
    ImageDraw.Draw(mask).text((-x0, -y0), text, font=font, fill=255)
    bounds = mask.getbbox()
    if bounds is None:
        raise ValueError(f"Headline line has no ink: {text!r}")
    return mask.crop(bounds)


def fitting_height(mask, box):
    left, top, right, bottom, _ = box
    width = right - left
    min_width_scale = 0.82 if width > 800 else 1
    return min(bottom - top, max(1, int(width * mask.height / mask.width / min_width_scale)))


def render_headline(masks, locale, boxes):
    heights = [fitting_height(mask, box) for mask, box in zip(masks, boxes, strict=True)]
    height_limit = min(heights) * 5 // 4
    lines = []
    for mask, box, fitted_height in zip(masks, boxes, heights, strict=True):
        left, top, right, bottom, alignment = box
        height = min(fitted_height, height_limit)
        stretch = (1.36 if locale == "zh" else 1.10) if right - left > 800 else 1
        width = min(right - left, max(1, round(mask.width * height / mask.height * stretch)))
        rendered = mask.resize((width, height), Image.Resampling.LANCZOS)
        lines.append((rendered, left_edge(left, right, width, alignment), top + (bottom - top - height) // 2))
    return lines


def ink_height(mask):
    # Count visible rows after resizing, excluding trace antialiasing and the panel.
    bounds = mask.point(lambda alpha: 255 if alpha >= INK_COVERAGE else 0).getbbox()
    return bounds[3] - bounds[1] if bounds else 0


def check_headline(lines, slug, locale):
    small, large = sorted(ink_height(mask) for mask, _, _ in lines)
    if small < MIN_INK_HEIGHT or 4 * small < 3 * large:
        raise ValueError(
            f"Headline ink for {slug} ({locale}) is {small}px / {large}px. "
            f"Each line needs at least {MIN_INK_HEIGHT}px and the smaller must be at least 75% of the larger."
        )


def draw_headline(canvas, lines, ground):
    first, panel, second = PALETTES[ground]
    draw = ImageDraw.Draw(canvas)
    for index, (mask, x, y) in enumerate(lines):
        if index == 1:
            draw.rounded_rectangle((x - 15, y - 10, x + mask.width + 15, y + mask.height + 10),
                                   radius=12, fill=panel)
        canvas.paste((first, second)[index], (x, y), mask)


def compose(entry, locale, font):
    ground = entry["ground"]
    arrangement = entry["arrangement"]
    masks = [glyph_mask(font, line, locale) for line in entry["headline"][locale]]
    layout = LAYOUTS[arrangement]
    if arrangement in SIDE_ALTERNATES:
        side, alternate = SIDE_ALTERNATES[arrangement]
        narrow, wide = masks[side], masks[1 - side]
        if narrow.width / narrow.height > wide.width / wide.height:
            layout = alternate
            side = 1 - side
        if fitting_height(masks[side], layout[side + 1]) < MIN_SIDE_HEIGHT:
            layout = SIDE_STACKS[arrangement]
    art_box, *type_boxes = layout
    lines = render_headline(masks, locale, type_boxes)
    check_headline(lines, entry["slug"], locale)
    left, top, right, bottom, alignment = art_box
    canvas = Image.new("RGB", SIZE, ground)
    with Image.open(SOURCE / "illustrations" / f"{entry['slug']}.webp") as source:
        art = source.convert("RGBA")
    art.thumbnail((right - left, bottom - top), Image.Resampling.LANCZOS)
    x = left_edge(left, right, art.width, alignment)
    canvas.paste(art, (x, bottom - art.height), art)
    draw_headline(canvas, lines, ground)

    for quality in (92, 86, 78, 68, 56):
        buffer = BytesIO()
        canvas.save(buffer, "WEBP", quality=quality, method=6)
        if buffer.tell() <= BYTE_LIMIT:
            return buffer.getvalue()
    raise ValueError(f"Cover exceeds {BYTE_LIMIT} bytes: {entry['slug']} ({locale})")


def main():
    entries = {
        entry["slug"]: entry
        for entry in json.loads((SOURCE / "manifest.json").read_text(encoding="utf-8"))
    }
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", type=Path, default=SOURCE.parents[1] / "public" / "blog" / "covers")
    parser.add_argument("--slug", choices=entries, help="Defaults to all manifest entries")
    parser.add_argument("--locale", choices=("en", "zh"), help="Defaults to both editions")
    args = parser.parse_args()
    font = ImageFont.truetype(str(cached_font()), 220)
    slugs = (args.slug,) if args.slug else entries
    locales = (args.locale,) if args.locale else ("en", "zh")
    for locale in locales:
        directory = args.out if locale == "en" else args.out / "zh"
        directory.mkdir(parents=True, exist_ok=True)
        for slug in slugs:
            data = compose(entries[slug], locale, font)
            path = directory / f"{slug}.webp"
            path.write_bytes(data)
            print(f"{path} ({len(data):,} bytes)")


if __name__ == "__main__":
    main()
