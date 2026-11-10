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
const note = (extra = "") =>
  `---\ntype: pattern\n${extra}---\n# Note\n\nBody.\n`;

beforeEach(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), "devlog-sync-"));
  src = path.join(tmp, "vault");
  notesDir = path.join(tmp, "out", "content");
  diagramsDir = path.join(tmp, "out", "diagrams");
  write(path.join(src, "Techniques", "kept.md"), note());
  write(path.join(src, "Cases", "Debug", "case.md"), note());
  write(path.join(src, "Glossary", "hidden.md"), note("publish: false\n"));
  write(path.join(src, "Agents", "INDEX.md"), note());
  write(path.join(src, "Templates", "template.md"), note());
  write(path.join(src, "Techniques", "draft.drawio"), "<mxfile/>");
  write(path.join(src, "Diagrams", "case.flow.svg"), "<svg/>");
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
  it("copies published notes and SVGs only", () => {
    const counts = syncDevlog({ src, notesDir, diagramsDir });

    expect(tree(notesDir)).toEqual([
      path.join("Cases", "Debug", "case.md"),
      path.join("Techniques", "kept.md"),
    ]);
    expect(tree(diagramsDir)).toEqual(["case.flow.svg"]);
    expect(counts).toEqual({
      notes: { copied: 2, skipped: 1, removed: 0 },
      diagrams: { copied: 1, removed: 0 },
    });
    expect(console.log).toHaveBeenCalledWith(
      "notes: 2 copied, 1 skipped, 0 removed; diagrams: 1 copied, 0 removed",
    );
  });

  it("mirrors deletions and newly unpublished notes", () => {
    syncDevlog({ src, notesDir, diagramsDir });
    fs.rmSync(path.join(src, "Cases", "Debug", "case.md"));
    fs.rmSync(path.join(src, "Diagrams", "case.flow.svg"));
    write(path.join(src, "Techniques", "kept.md"), note("publish: false\n"));
    write(path.join(notesDir, "Maps", "stray.md"), note());

    const counts = syncDevlog({ src, notesDir, diagramsDir });

    expect(tree(notesDir)).toEqual([]);
    expect(tree(diagramsDir)).toEqual([]);
    expect(counts.notes).toEqual({ copied: 0, skipped: 2, removed: 3 });
    expect(counts.diagrams.removed).toBe(1);
  });

  it("fails when the vault is missing", () => {
    expect(() =>
      syncDevlog({ src: path.join(tmp, "nope"), notesDir, diagramsDir }),
    ).toThrow(/vault not found/);
  });
});
