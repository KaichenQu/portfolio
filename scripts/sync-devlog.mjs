#!/usr/bin/env node
// Mirrors the DevLog vault into content/devlog/ (notes) and public/blog/diagrams/
// (the SVGs those notes reference).
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

// Same shapes as parseFrontmatter in src/lib/devlog.ts; keep the two in step.
const FM_OPEN = /^\uFEFF?---[ \t]*\r?(?:\n|$)/;
const FM_BLOCK = /^---\r?\n(?:([\s\S]*?)\r?\n)?---\r?(?:\n|$)/;
const DIAGRAM_REF = /!\[[^\]]*\]\(\s*<?([^)\s>]+)/g;
const DIAGRAM = /(?:^|\/)Diagrams\/([^/]+\.svg)$/;

/** Throws on a block that opens with `---` but would not parse, so `publish: false` never fails open. */
function unpublished(text, file) {
  if (!FM_OPEN.test(text)) return false;
  const fm = FM_BLOCK.exec(text);
  const lines = (fm?.[1] ?? "").split(/\r?\n/);
  if (!fm || lines.some((l) => l.trim() && !/^[A-Za-z_][\w-]*:/.test(l)))
    throw new Error(`Malformed frontmatter in ${file}`);
  return lines.some((l) => /^publish:\s*false\s*$/.test(l));
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

/** Returns the counts it also prints. Reads and checks everything before the first write. */
export function syncDevlog({ src, notesDir, diagramsDir }) {
  if (!fs.existsSync(src)) throw new Error(`DevLog vault not found: ${src}`);
  const notes = { copied: 0, skipped: 0, removed: 0 };
  const diagrams = { copied: 0, removed: 0 };

  const publish = new Map();
  const svgs = new Set();
  for (const folder of FOLDERS) {
    const abs = path.join(src, folder);
    if (!fs.existsSync(abs)) continue;
    for (const name of fs.readdirSync(abs)) {
      const rel = path.join(folder, name);
      if (!name.endsWith(".md") || EXCLUDE.has(rel.split(path.sep).join("/")))
        continue;
      const file = path.join(abs, name);
      const text = fs.readFileSync(file, "utf8");
      if (unpublished(text, file)) {
        notes.skipped++;
        continue;
      }
      publish.set(rel, text);
      for (const [, url] of text.matchAll(DIAGRAM_REF)) {
        const svg = DIAGRAM.exec(url)?.[1];
        if (svg && fs.existsSync(path.join(src, "Diagrams", svg))) svgs.add(svg);
      }
    }
  }
  // A wrong DEVLOG_DIR would otherwise wipe both targets.
  if (publish.size + notes.skipped === 0)
    throw new Error(`No DevLog notes found in ${src}; nothing was changed`);

  for (const [rel, text] of publish) {
    fs.mkdirSync(path.join(notesDir, path.dirname(rel)), { recursive: true });
    fs.writeFileSync(path.join(notesDir, rel), text);
    notes.copied++;
  }
  notes.removed = prune(notesDir, new Set(publish.keys()));

  if (svgs.size) fs.mkdirSync(diagramsDir, { recursive: true });
  for (const name of svgs) {
    fs.copyFileSync(path.join(src, "Diagrams", name), path.join(diagramsDir, name));
    diagrams.copied++;
  }
  diagrams.removed = prune(diagramsDir, svgs);

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
