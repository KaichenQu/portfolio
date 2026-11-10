// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { assertClean, syncDevlog } from "./sync-devlog.mjs";

let tmp, src, notesDir, diagramsDir;

const write = (file, text) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
};
const note = (extra = "", body = "Body.") =>
  `---\ntype: pattern\n${extra}---\n# Note\n\n${body}\n`;

beforeEach(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), "devlog-sync-"));
  src = path.join(tmp, "vault");
  notesDir = path.join(tmp, "out", "content");
  diagramsDir = path.join(tmp, "out", "diagrams");
  write(path.join(src, "Techniques", "kept.md"), note());
  write(
    path.join(src, "Cases", "Debug", "case.md"),
    note("", "![flow](../../Diagrams/case.flow.svg)"),
  );
  write(path.join(src, "Maps", "plain.md"), "# No frontmatter\n");
  write(
    path.join(src, "Glossary", "hidden.md"),
    note("publish: false\n", "![x](../Diagrams/hidden.svg)"),
  );
  write(path.join(src, "Agents", "INDEX.md"), note());
  write(path.join(src, "Templates", "template.md"), note());
  write(path.join(src, "Techniques", "draft.drawio"), "<mxfile/>");
  write(path.join(src, "Diagrams", "case.flow.svg"), "<svg/>");
  write(path.join(src, "Diagrams", "hidden.svg"), "<svg/>");
  write(path.join(src, "Diagrams", "orphan.svg"), "<svg/>");
  write(path.join(src, "Diagrams", "case.flow.drawio"), "<mxfile/>");
  write(path.join(src, "_meta", "redactions.txt"), "# synthetic\nNOT-IN-ANY-NOTE\n");
  vi.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  fs.rmSync(tmp, { recursive: true, force: true });
  vi.restoreAllMocks();
});

const tree = (dir) =>
  fs
    .readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((e) => e.isFile())
    .map((e) => path.relative(dir, path.join(e.parentPath, e.name)))
    .sort();

describe("syncDevlog", () => {
  it("copies published notes and only the SVGs they reference", () => {
    const counts = syncDevlog({ src, notesDir, diagramsDir });

    expect(tree(notesDir)).toEqual([
      path.join("Cases", "Debug", "case.md"),
      path.join("Maps", "plain.md"),
      path.join("Techniques", "kept.md"),
    ]);
    expect(tree(diagramsDir)).toEqual(["case.flow.svg"]);
    expect(counts).toEqual({
      notes: { copied: 3, skipped: 1, removed: 0 },
      diagrams: { copied: 1, removed: 0 },
      redactions: {
        notes: 0,
        diagrams: 0,
        entityEncoded: 0,
        perPattern: { 2: 0 },
      },
      hidden: { lines: 0, links: 0 },
    });
    expect(console.log).toHaveBeenCalledWith(
      "notes: 3 copied, 1 skipped, 0 removed; diagrams: 1 copied, 0 removed",
    );
  });

  it("prunes a diagram once no published note references it", () => {
    syncDevlog({ src, notesDir, diagramsDir });
    write(path.join(src, "Cases", "Debug", "case.md"), note());

    expect(syncDevlog({ src, notesDir, diagramsDir }).diagrams).toEqual({
      copied: 0,
      removed: 1,
    });
    expect(tree(diagramsDir)).toEqual([]);
  });

  it("mirrors deletions and newly unpublished notes", () => {
    syncDevlog({ src, notesDir, diagramsDir });
    fs.rmSync(path.join(src, "Cases", "Debug", "case.md"));
    fs.rmSync(path.join(src, "Diagrams", "case.flow.svg"));
    write(path.join(src, "Techniques", "kept.md"), note("publish: false\n"));
    fs.rmSync(path.join(src, "Maps", "plain.md"));
    write(path.join(notesDir, "Maps", "stray.md"), note());

    const counts = syncDevlog({ src, notesDir, diagramsDir });

    expect(tree(notesDir)).toEqual([]);
    expect(tree(diagramsDir)).toEqual([]);
    expect(counts.notes).toEqual({ copied: 0, skipped: 2, removed: 4 });
    expect(counts.diagrams.removed).toBe(1);
  });

  it.each([
    ["a BOM", "\uFEFF---\npublish: false\n---\n# T\n"],
    ["an empty block", "---\n---\n# T\n"],
    ["only blank lines", "---\n\n---\n# T\n"],
    ["a trailing space", "--- \npublish: false\n---\n# T\n"],
    ["no closing line", "---\npublish: false\n# T\n"],
    ["a line that is not key: value", "---\npublish: false\n  - x\n---\n"],
  ])("fails before writing on frontmatter with %s", (_, text) => {
    const bad = path.join(src, "Glossary", "bad.md");
    write(bad, text);

    expect(() => syncDevlog({ src, notesDir, diagramsDir })).toThrow(
      `Malformed frontmatter in ${bad}`,
    );
    expect(fs.existsSync(notesDir)).toBe(false);
  });

  it("aborts without touching the targets when the vault has no notes", () => {
    const empty = path.join(tmp, "elsewhere");
    write(path.join(empty, "Templates", "template.md"), note());
    syncDevlog({ src, notesDir, diagramsDir });

    const patternsFile = path.join(src, "_meta", "redactions.txt");
    expect(() =>
      syncDevlog({ src: empty, notesDir, diagramsDir, patternsFile }),
    ).toThrow(
      /No DevLog notes found/,
    );
    expect(tree(notesDir)).toHaveLength(3);
    expect(tree(diagramsDir)).toEqual(["case.flow.svg"]);
  });

  it("fails when the vault is missing", () => {
    expect(() =>
      syncDevlog({ src: path.join(tmp, "nope"), notesDir, diagramsDir }),
    ).toThrow(/vault not found/);
  });
});

describe("redaction", () => {
  const S = "▒";
  const patterns = (...lines) =>
    write(path.join(src, "_meta", "redactions.txt"), lines.join("\n") + "\n");
  const read = (rel) => fs.readFileSync(path.join(notesDir, rel), "utf8");
  const kept = path.join("Techniques", "kept.md");
  const keptSrc = () => path.join(src, kept);

  it("masks literal and regex matches with a rounded, capped run", () => {
    patterns(
      "# comment",
      "",
      "Acme Corp",
      "/k-\\d+/i",
      "/(?<![\\w+\\/])tok(?![\\w+\\/])/",
      "/x{30}/",
    );
    write(
      path.join(src, "Techniques", "kept.md"),
      "---\ntype: pattern\nstatus: Acme Corp\n---\n# Acme Corp notes\n\n" +
        `K-12 and k-7, tok but not +tok or tok/, ${"x".repeat(30)}.\n`,
    );

    const { redactions } = syncDevlog({ src, notesDir, diagramsDir });

    expect(read(kept)).toBe(
      `---\ntype: pattern\nstatus: ${S.repeat(12)}\n---\n# ${S.repeat(12)} notes\n\n` +
        `${S.repeat(4)} and ${S.repeat(4)}, ${S.repeat(4)} but not +tok or tok/, ${S.repeat(24)}.\n`,
    );
    expect(redactions).toEqual({
      notes: 1,
      diagrams: 0,
      entityEncoded: 0,
      perPattern: { 3: 2, 4: 2, 5: 1, 6: 1 },
    });
    expect(console.log).toHaveBeenCalledWith(
      "redacted: 6 matches in 1 notes and 0 diagrams (0 entity-encoded in SVGs)",
    );
    expect(console.log).toHaveBeenCalledWith("pattern #4: 2");
  });

  it("matches a lookbehind entry on the text before an earlier entry masks its context", () => {
    patterns("Acme", "/(?<=Acme )Corp/");
    write(keptSrc(), note("", "Acme Corp"));

    const { redactions } = syncDevlog({ src, notesDir, diagramsDir });

    expect(read(kept)).toContain(`\n${S.repeat(4)} ${S.repeat(4)}\n`);
    expect(redactions.perPattern).toEqual({ 1: 1, 2: 1 });
  });

  it("masks two overlapping literals as one merged run", () => {
    patterns("Acme Co", "me Corp");
    write(keptSrc(), note("", "Acme Corp."));

    const { redactions } = syncDevlog({ src, notesDir, diagramsDir });

    expect(read(kept)).toContain(`\n${S.repeat(12)}.\n`);
    expect(redactions.perPattern).toEqual({ 1: 1, 2: 1 });
  });

  it("drops the private frontmatter keys and keeps the rest as written", () => {
    write(
      keptSrc(),
      "---\ntype: pattern\nproject: p\nlinks: [PR #1]\ntags:   [a, b]\nsource: s\ntriggers: [t]\n---\n# T\n",
    );
    write(path.join(src, "Maps", "plain.md"), "---\nproject: p\n---\n# M\n");

    syncDevlog({ src, notesDir, diagramsDir });

    expect(read(kept)).toBe("---\ntype: pattern\ntags:   [a, b]\n---\n# T\n");
    expect(read(path.join("Maps", "plain.md"))).toBe("# M\n");
  });

  it.each([
    ["is missing", null, /Redaction patterns not found/],
    ["has no entries", "# only a comment\n\n", /No redaction patterns/],
  ])("aborts when the patterns file %s", (_, text, error) => {
    const file = path.join(src, "_meta", "redactions.txt");
    if (text === null) fs.rmSync(file);
    else write(file, text);

    expect(() => syncDevlog({ src, notesDir, diagramsDir })).toThrow(error);
    expect(fs.existsSync(notesDir)).toBe(false);
  });

  it.each([
    ["a bad regex", "/secret(/", /^Invalid regex on line 2 of /],
    ["the y flag", "/secret/y", /^Line 2 of .* is not \/body\/flags/],
    ["an unknown flag", "/secret/x", /^Line 2 of .* is not \/body\/flags/],
    ["no closing slash", "/secret", /^Line 2 of .* is not \/body\/flags/],
    ["trailing whitespace", "secret ", /^Trailing whitespace on line 2 of /],
  ])("rejects %s, naming the line but not the entry", (_, entry, error) => {
    patterns("fine", entry);

    expect(() => syncDevlog({ src, notesDir, diagramsDir })).toThrow(error);
    expect(() => syncDevlog({ src, notesDir, diagramsDir })).not.toThrow(/secret/);
    expect(fs.existsSync(notesDir)).toBe(false);
  });

  it("aborts without touching the targets when a pattern matches a file name", () => {
    syncDevlog({ src, notesDir, diagramsDir });
    const before = read(kept);
    write(keptSrc(), note("", "changed"));
    patterns("lain");

    expect(() => syncDevlog({ src, notesDir, diagramsDir })).toThrow(
      `A redaction pattern matches the file name of ${path.join(src, "Maps", "plain.md")}`,
    );
    expect(read(kept)).toBe(before);
  });

  it("aborts when a pattern matches only the slug form of a file name", () => {
    write(path.join(src, "Techniques", "Two Words.md"), note());
    patterns("two-words");

    expect(() => syncDevlog({ src, notesDir, diagramsDir })).toThrow(
      `A redaction pattern matches the file name of ${path.join(src, "Techniques", "Two Words.md")}`,
    );
  });

  it("aborts when a pattern matches a referenced diagram's file name", () => {
    patterns("/\\.flow$/");

    expect(() => syncDevlog({ src, notesDir, diagramsDir })).toThrow(
      `A redaction pattern matches the file name of ${path.join(src, "Diagrams", "case.flow.svg")}`,
    );
    expect(fs.existsSync(notesDir)).toBe(false);
  });

  it.each([
    ["publish: False", 0],
    ['publish: "false"', 0],
    ["publish: 'TRUE'", 1],
  ])("reads %s", (line, copied) => {
    write(keptSrc(), note(`${line}\n`));

    syncDevlog({ src, notesDir, diagramsDir });

    expect(tree(notesDir).filter((f) => f === kept)).toHaveLength(copied);
  });

  it.each(["publish: no", "publish: 'false\"", "publish:"])(
    "throws naming the file on %s",
    (line) => {
      write(keptSrc(), note(`${line}\n`));

      expect(() => syncDevlog({ src, notesDir, diagramsDir })).toThrow(
        `Invalid publish value in ${keptSrc()}`,
      );
      expect(fs.existsSync(notesDir)).toBe(false);
    },
  );

  it("aborts when a source note already contains the mask glyph", () => {
    write(keptSrc(), note("", `already ${S}`));

    expect(() => syncDevlog({ src, notesDir, diagramsDir })).toThrow(
      `${path.join(src, "Techniques", "kept.md")} already contains ${S}`,
    );
    expect(fs.existsSync(notesDir)).toBe(false);
  });

  const svg = (extra = "") =>
    `<svg xmlns="http://www.w3.org/2000/svg" content="&lt;mxfile&gt;Acme Corp&lt;/mxfile&gt;" width="10">` +
    `<switch><foreignObject width="5"><div>Acme Corp</div></foreignObject>` +
    `<image x="1" xlink:href="data:image/png;base64,QUJD"/></switch>` +
    `<switch><g/><text>Viewer does not support full SVG 1.1</text></switch>${extra}</svg>`;

  it("strips the embedded source and PNG label fallbacks, then masks the SVG", () => {
    patterns("Acme Corp");
    write(path.join(src, "Diagrams", "case.flow.svg"), svg());

    const { redactions } = syncDevlog({ src, notesDir, diagramsDir });

    expect(fs.readFileSync(path.join(diagramsDir, "case.flow.svg"), "utf8")).toBe(
      `<svg xmlns="http://www.w3.org/2000/svg" width="10">` +
        `<switch><foreignObject width="5"><div>${S.repeat(12)}</div></foreignObject></switch>` +
        `<switch><g/><text>Viewer does not support full SVG 1.1</text></switch></svg>`,
    );
    expect(redactions).toMatchObject({ diagrams: 1, perPattern: { 1: 1 } });
  });

  it("masks SVG labels whose match only shows once entities are decoded", () => {
    patterns("Acme & Co", "/Acme Corp/");
    write(
      path.join(src, "Diagrams", "case.flow.svg"),
      `<svg><foreignObject><div>Acme &amp; Co</div><div>&#65;cme&#x20;Corp</div></foreignObject>` +
        `<text>Acme &amp;amp; Co</text></svg>`,
    );

    const { redactions } = syncDevlog({ src, notesDir, diagramsDir });

    expect(fs.readFileSync(path.join(diagramsDir, "case.flow.svg"), "utf8")).toBe(
      `<svg><foreignObject><div>${S.repeat(12)}</div><div>${S.repeat(12)}</div></foreignObject>` +
        `<text>Acme &amp;amp; Co</text></svg>`,
    );
    expect(redactions).toMatchObject({ entityEncoded: 2, perPattern: { 1: 1, 2: 1 } });
  });

  it("aborts naming the file and line when a pattern still matches the output", () => {
    // Masking `z` exposes a `q` the first entry's lookahead had excluded.
    patterns("/q(?!z)/", "z");
    write(keptSrc(), note("", "qz"));

    expect(() => syncDevlog({ src, notesDir, diagramsDir })).toThrow(
      `Pattern on line 1 still matches ${path.join(notesDir, kept)} (raw view)`,
    );
    expect(fs.existsSync(notesDir)).toBe(false);
  });

  it("strips a spaced content attribute after a comment that mentions the root", () => {
    patterns("Acme Corp");
    write(
      path.join(src, "Diagrams", "case.flow.svg"),
      `<?xml version="1.0"?><!-- <svg content="x"> Acme Corp -->` +
        `<svg width="1" content = '&lt;mxfile/&gt;'><text>ok</text></svg>`,
    );

    syncDevlog({ src, notesDir, diagramsDir });

    expect(fs.readFileSync(path.join(diagramsDir, "case.flow.svg"), "utf8")).toBe(
      `<?xml version="1.0"?><svg width="1"><text>ok</text></svg>`,
    );
  });

  it.each([
    `<image href="data:image/png;base64,QUJD"/>`,
    `<image href="DATA:IMAGE/PNG;base64,QUJD"/>`,
    `<style>@font-face{src:url(data:font/woff2;base64,QUJD)}</style>`,
  ])("aborts naming the SVG when a data: URI survives: %s", (extra) => {
    const file = path.join(src, "Diagrams", "case.flow.svg");
    write(file, svg(extra));

    expect(() => syncDevlog({ src, notesDir, diagramsDir })).toThrow(
      `${file} still embeds a data: URI`,
    );
    expect(fs.existsSync(notesDir)).toBe(false);
  });

  it("mirrors only SVGs, even when a note points at other diagram files", () => {
    write(path.join(src, "Diagrams", "case.flow.html"), "<html/>");
    write(
      keptSrc(),
      note("", "![a](../Diagrams/case.flow.html) ![b](../Diagrams/case.flow.drawio)"),
    );

    syncDevlog({ src, notesDir, diagramsDir });

    expect(tree(diagramsDir)).toEqual(["case.flow.svg"]);
  });
});

describe("held-back notes", () => {
  const S8 = "\u2592".repeat(8);
  const read = (rel) => fs.readFileSync(path.join(notesDir, rel), "utf8");
  const map = () => path.join(src, "Maps", "plain.md");
  const held = (stem) =>
    write(path.join(src, "Techniques", `${stem}.md`), note("publish: false\n"));

  it("drops list items that only link held-back notes and masks every other link", () => {
    held("Held Note");
    write(
      map(),
      "# Map\n\n- [[held note]] one-line summary\n  * [[Held Note|alias]] and [[held-note]]\n" +
        "3. [[Held Note]]\n- [[ETag]] beside [[Held Note|an alias]]\n- no links here\n\n" +
        "Prose with [[Held Note]] and [[Held Note|alias]].\n",
    );

    const { hidden } = syncDevlog({ src, notesDir, diagramsDir });

    expect(read(path.join("Maps", "plain.md"))).toBe(
      `# Map\n\n- [[ETag]] beside ${S8}\n- no links here\n\nProse with ${S8} and ${S8}.\n`,
    );
    expect(hidden).toEqual({ lines: 3, links: 3 });
    expect(console.log).toHaveBeenCalledWith(
      "held-back links: 3 list lines dropped, 3 links masked",
    );
  });

  it.each([
    ["the stem in plain text", "see Held Note here"],
    ["the slug", "see /blog/held-note here"],
    ["the stem split by emphasis", "see Held **Note** here"],
  ])("aborts naming only the output file when it still shows %s", (_, body) => {
    held("Held Note");
    write(map(), `# Map\n\n${body}\n`);

    let error;
    try {
      syncDevlog({ src, notesDir, diagramsDir });
    } catch (e) {
      error = e;
    }
    expect(error?.message).toMatch(
      `${path.join(notesDir, "Maps", "plain.md")} still names a held-back note`,
    );
    expect(error.message.toLowerCase()).not.toContain("held note");
    expect(fs.existsSync(notesDir)).toBe(false);
  });
});

describe("assertClean", () => {
  const patterns = [{ line: 1, re: /Acme Corp/g }];
  const check = (text) => () => assertClean("out.md", text, patterns, []);

  it.each([
    ["a soft wrap", "Acme\nCorp"],
    ["emphasis markers", "Ac**me Corp**"],
    ["a <br/>", "Acme<br/>Corp"],
    ["&#160;", "Acme&#160;Corp"],
    ["a numeric entity inside the word", "Ac&#109;e Corp"],
    ["%20", "Acme%20Corp"],
    ["a <span> inside an SVG label", "<div>Ac<span>me</span> Corp</div>"],
  ])("aborts on a term split by %s", (_, text) => {
    expect(check(text)).toThrow(/^Pattern on line 1 still matches out\.md \(/);
  });

  it("passes text no view joins into a match", () => {
    expect(check("Acme Inc, Corp")).not.toThrow();
  });
});
