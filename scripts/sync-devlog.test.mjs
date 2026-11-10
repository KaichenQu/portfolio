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

    expect(() => syncDevlog({ src: empty, notesDir, diagramsDir })).toThrow(
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
