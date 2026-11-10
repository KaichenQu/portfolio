#!/usr/bin/env node
// Mirrors the DevLog vault into content/devlog/ (notes) and public/blog/diagrams/ (SVGs).
// Both targets are gitignored: the vault is private, so synced files stay local.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const FOLDERS = [
  "Cases/Debug",
  "Cases/Design",
  "Techniques",
  "Maps",
  "Cheatsheets",
  "Glossary",
  "Agents",
];
const EXCLUDE = new Set(["Agents/INDEX.md"]);

function unpublished(text) {
  const fm = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  return !!fm && /^publish:\s*false\s*$/m.test(fm[1]);
}

function listFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((e) => e.isFile())
    .map((e) => path.relative(dir, path.join(e.parentPath, e.name)));
}

function prune(dir, keep) {
  let removed = 0;
  for (const rel of listFiles(dir)) {
    if (keep.has(rel)) continue;
    fs.rmSync(path.join(dir, rel));
    removed++;
  }
  return removed;
}

/** Returns the counts it also prints. */
export function syncDevlog({ src, notesDir, diagramsDir }) {
  if (!fs.existsSync(src)) throw new Error(`DevLog vault not found: ${src}`);
  const notes = { copied: 0, skipped: 0, removed: 0 };
  const diagrams = { copied: 0, removed: 0 };

  const keepNotes = new Set();
  for (const folder of FOLDERS) {
    const abs = path.join(src, folder);
    if (!fs.existsSync(abs)) continue;
    for (const name of fs.readdirSync(abs)) {
      const rel = path.join(folder, name);
      if (!name.endsWith(".md") || EXCLUDE.has(rel.split(path.sep).join("/")))
        continue;
      const text = fs.readFileSync(path.join(abs, name), "utf8");
      if (unpublished(text)) {
        notes.skipped++;
        continue;
      }
      fs.mkdirSync(path.join(notesDir, folder), { recursive: true });
      fs.writeFileSync(path.join(notesDir, rel), text);
      keepNotes.add(rel);
      notes.copied++;
    }
  }
  notes.removed = prune(notesDir, keepNotes);

  const keepSvgs = new Set();
  const srcDiagrams = path.join(src, "Diagrams");
  if (fs.existsSync(srcDiagrams)) {
    fs.mkdirSync(diagramsDir, { recursive: true });
    for (const name of fs.readdirSync(srcDiagrams)) {
      if (!name.endsWith(".svg")) continue;
      fs.copyFileSync(
        path.join(srcDiagrams, name),
        path.join(diagramsDir, name),
      );
      keepSvgs.add(name);
      diagrams.copied++;
    }
  }
  diagrams.removed = prune(diagramsDir, keepSvgs);

  console.log(
    `notes: ${notes.copied} copied, ${notes.skipped} skipped, ${notes.removed} removed; ` +
      `diagrams: ${diagrams.copied} copied, ${diagrams.removed} removed`,
  );
  return { notes, diagrams };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  syncDevlog({
    src:
      process.env.DEVLOG_DIR || path.join(os.homedir(), "Obsidian", "DevLog"),
    notesDir: path.join(root, "content", "devlog"),
    diagramsDir: path.join(root, "public", "blog", "diagrams"),
  });
}
