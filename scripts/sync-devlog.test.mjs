// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { syncDevlog } from "./sync-devlog.mjs";

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
      redactions: { notes: 0, diagrams: 0, perPattern: { 2: 0 } },
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
      perPattern: { 3: 2, 4: 2, 5: 1, 6: 1 },
    });
    expect(console.log).toHaveBeenCalledWith(
      "redacted: 6 matches in 1 notes and 0 diagrams",
    );
    expect(console.log).toHaveBeenCalledWith("pattern #4: 2");
  });

  it("applies entries in file order, each to the previous one's output", () => {
    patterns("Acme", "Acme Corp");
    write(keptSrc(), note("", "Acme Corp"));

    const { redactions } = syncDevlog({ src, notesDir, diagramsDir });

    expect(read(kept)).toContain(`${S.repeat(4)} Corp`);
    expect(redactions.perPattern).toEqual({ 1: 1, 2: 0 });
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

  it("names the line of a bad regex, not the entry", () => {
    patterns("fine", "/secret(/");

    expect(() => syncDevlog({ src, notesDir, diagramsDir })).toThrow(
      /^Invalid regex on line 2 of [^(]*$/,
    );
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

  it("aborts naming the SVG when a data:image/ payload survives", () => {
    const file = path.join(src, "Diagrams", "case.flow.svg");
    write(file, svg(`<image href="data:image/png;base64,QUJD"/>`));

    expect(() => syncDevlog({ src, notesDir, diagramsDir })).toThrow(
      `${file} still embeds a data:image/ payload`,
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
