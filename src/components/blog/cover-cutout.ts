import sharp from "sharp";

const CUTOUT_WIDTH = 720;

/** Separate the white ground so the same art can sit on either editor theme. */
export async function cutOutPaper(source: Buffer) {
  const { data, info: { width, height } } = await sharp(source)
    .resize(CUTOUT_WIDTH)
    .toColourspace("srgb")
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const size = width * height;
  const paper = new Uint8Array(size);
  const queue = new Uint32Array(size);
  let tail = 0;

  function visit(i: number) {
    if (paper[i]) return;
    const r = data[i * 3], g = data[i * 3 + 1], b = data[i * 3 + 2];
    const low = Math.min(r, g, b);
    if (low < 198 || Math.max(r, g, b) - low > 30) return;
    paper[i] = 1;
    queue[tail++] = i;
  }

  // White pixels also seed the visible ground in holes such as a key or gear.
  for (let i = 0; i < size; i++) {
    const p = i * 3;
    if (data[p] >= 251 && data[p + 1] >= 251 && data[p + 2] >= 251) visit(i);
  }

  for (let head = 0; head < tail; head++) {
    const i = queue[head];
    const x = i % width;
    if (x > 0) visit(i - 1);
    if (x < width - 1) visit(i + 1);
    if (i >= width) visit(i - width);
    if (i + width < size) visit(i + width);
  }

  const result = Buffer.alloc(size * 4);
  for (let i = 0; i < size; i++) {
    const p = i * 3, q = i * 4;
    const low = Math.min(data[p], data[p + 1], data[p + 2]);
    const chroma = Math.max(data[p], data[p + 1], data[p + 2]) - low;
    const brightness = Math.min(1, (low - 198) / 40);
    const neutrality = Math.min(1, (30 - chroma) / 12);
    const matte = paper[i] ? low * brightness * neutrality : 0;
    const alpha = 1 - matte / 255;
    if (alpha === 0) continue;
    // Undo the original white composite while retaining the soft edges.
    for (let c = 0; c < 3; c++) result[q + c] = Math.round((data[p + c] - matte) / alpha);
    result[q + 3] = Math.round(alpha * 255);
  }
  return sharp(result, { raw: { width, height, channels: 4 } }).webp({ quality: 82 }).toBuffer();
}
