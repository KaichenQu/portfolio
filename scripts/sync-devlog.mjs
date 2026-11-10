#!/usr/bin/env node
// Mirrors the DevLog vault into content/devlog/ (notes) and public/blog/diagrams/
// (the SVGs those notes reference), redacted with the vault's private patterns
// file. Both targets are committed by `npm run devlog:publish`, so nothing
// unredacted may ever reach them.
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
const FM_OPEN = /^﻿?---[ \t]*\r?(?:\n|$)/;
const FM_BLOCK = /^---\r?\n(?:([\s\S]*?)\r?\n)?---\r?(?:\n|$)/;
const FM_LINE = /^([A-Za-z_][\w-]*):(.*)/;
const DIAGRAM_REF = /!\[[^\]]*\]\(\s*<?([^)\s>]+)/g;
const DIAGRAM = /(?:^|\/)Diagrams\/([^/]+\.svg)$/;
// Never rendered, and must not sit in the public repo.
const DROPPED_KEYS = new Set(["project", "links", "source", "triggers"]);
const SHADE = "▒";

/** Returns the frontmatter match, or null without one; throws on a block that would not parse. */
function frontmatter(text, file) {
  if (!FM_OPEN.test(text)) return null;
  const fm = FM_BLOCK.exec(text);
  const lines = (fm?.[1] ?? "").split(/\r?\n/);
  if (!fm?.[1]?.trim() || lines.some((l) => l.trim() && !FM_LINE.test(l)))
    throw new Error(`Malformed frontmatter in ${file}`);
  return fm;
}

/**
 * One entry per line: `/body/flags` (the last `/` separates; `g` is implied)
 * or a case-sensitive literal. Errors name the line, never the entry.
 */
export function loadPatterns(file) {
  if (!fs.existsSync(file))
    throw new Error(
      `Redaction patterns not found: ${file}; nothing was changed`,
    );
  const patterns = [];
  fs.readFileSync(file, "utf8")
    .split(/\r?\n/)
    .forEach((line, i) => {
      if (!line.trim() || line.startsWith("#")) return;
      const m = /^\/(.+)\/([dgimsuvy]*)$/.exec(line);
      let re;
      try {
        re = m
          ? new RegExp(m[1], m[2].includes("g") ? m[2] : m[2] + "g")
          : new RegExp(line.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
      } catch {
        throw new Error(`Invalid regex on line ${i + 1} of ${file}`);
      }
      patterns.push({ line: i + 1, re });
    });
  if (patterns.length === 0)
    throw new Error(`No redaction patterns in ${file}; nothing was changed`);
  return patterns;
}

/** Length rounded up to a multiple of 4, capped at 24, so the exact length does not leak. */
const mask = (match) =>
  SHADE.repeat(Math.min(24, Math.ceil([...match].length / 4) * 4));

/**
 * Applies the patterns in file order, each to the output of the previous one.
 * A `▒` run is ordinary text to later entries, so it is re-masked only by an
 * entry that matches `▒` itself.
 */
function redact(text, patterns, hits) {
  for (const { line, re } of patterns)
    text = text.replace(re, (m) => {
      if (!m) return m;
      hits.set(line, (hits.get(line) ?? 0) + 1);
      return mask(m);
    });
  return text;
}

const ENTITY = /&(?:(amp|lt|gt|quot|apos)|#(\d{1,7})|#x([0-9a-fA-F]{1,6}));/g;
const NAMED = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };

/** The text with XML entities decoded, and each decoded code unit's raw offset (plus one for the end). */
function decodeEntities(raw) {
  let text = "";
  const at = [];
  let i = 0;
  const copyTo = (end) => {
    for (; i < end; i++) {
      text += raw[i];
      at.push(i);
    }
  };
  for (const m of raw.matchAll(ENTITY)) {
    copyTo(m.index);
    const code = m[2] ? Number(m[2]) : parseInt(m[3] ?? "", 16);
    const ch = m[1]
      ? NAMED[m[1]]
      : code <= 0x10ffff
        ? String.fromCodePoint(code)
        : m[0];
    for (let k = 0; k < ch.length; k++) at.push(m.index);
    text += ch;
    i = m.index + m[0].length;
  }
  copyTo(raw.length);
  at.push(raw.length);
  return { text, at };
}

/**
 * Per pattern, in file order: mask raw matches, then matches that only show
 * once entities are decoded (`A &amp; B`), replacing their raw span.
 */
function redactSvg(svg, patterns, hits, encoded) {
  for (const p of patterns) {
    svg = redact(svg, [p], hits);
    const { text, at } = decodeEntities(svg);
    let out = "";
    let last = 0;
    for (const m of text.matchAll(p.re)) {
      if (!m[0]) continue;
      out += svg.slice(last, at[m.index]) + mask(m[0]);
      last = at[m.index + m[0].length];
      hits.set(p.line, (hits.get(p.line) ?? 0) + 1);
      encoded.n++;
    }
    svg = out + svg.slice(last);
  }
  return svg;
}

/** Zero-length matches do not count: they mask nothing. */
const hit = (s, re) => [...s.matchAll(re)].some((m) => m[0]);

/** Fail closed: no pattern may match what is about to be written. */
function assertRedacted(file, views, patterns) {
  for (const { line, re } of patterns)
    if (views.some((v) => hit(v, re)))
      throw new Error(
        `Pattern on line ${line} still matches ${file} after redaction; nothing was changed`,
      );
}

const total = (hits) => [...hits.values()].reduce((a, b) => a + b, 0);

/** Drops the private keys, masks the remaining values, then masks the title and body. */
function redactNote(text, fm, patterns, hits) {
  if (!fm) return redact(text, patterns, hits);
  const eol = /\r\n/.test(fm[0]) ? "\r\n" : "\n";
  const kept = fm[1]
    .split(/\r?\n/)
    .filter((l) => !DROPPED_KEYS.has(FM_LINE.exec(l)?.[1]))
    .map((l) =>
      l.replace(FM_LINE, (_, k, v) => `${k}:${redact(v, patterns, hits)}`),
    );
  const body = redact(text.slice(fm[0].length), patterns, hits);
  // An emptied block would no longer parse, so it goes too.
  if (!kept.some((l) => l.trim())) return body;
  const close = fm[0].endsWith("\n") ? eol : "";
  return `---${eol}${kept.join(eol)}${eol}---${close}${body}`;
}

/**
 * Drops draw.io's embedded editable source and the PNG label fallbacks (the
 * `<image>` after a `<switch>`'s `<foreignObject>`, which browsers never pick),
 * so the only label text left is the text the patterns can reach.
 */
export function stripSvg(svg) {
  return svg
    .replace(/<svg\b(?:[^>"']|"[^"]*"|'[^']*')*>/, (root) =>
      root.replace(/\scontent=(?:"[^"]*"|'[^']*')/, ""),
    )
    .replace(
      /(<switch\b[^>]*>\s*<foreignObject\b[\s\S]*?<\/foreignObject>)([\s\S]*?)(<\/switch>)/g,
      (_, head, rest, close) =>
        head +
        rest.replace(/<image\b[^>]*?(?:\/>|>[\s\S]*?<\/image>)/g, "") +
        close,
    );
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

const matchesAny = (s, patterns) => patterns.some(({ re }) => hit(s, re));

/** Returns the counts it also prints. Reads, checks and redacts everything before the first write. */
export function syncDevlog({
  src,
  notesDir,
  diagramsDir,
  patternsFile = path.join(src, "_meta", "redactions.txt"),
}) {
  if (!fs.existsSync(src)) throw new Error(`DevLog vault not found: ${src}`);
  const patterns = loadPatterns(patternsFile);
  const notes = { copied: 0, skipped: 0, removed: 0 };
  const diagrams = { copied: 0, removed: 0 };
  const hits = new Map();
  const touched = { notes: 0, diagrams: 0 };
  const encoded = { n: 0 };

  const publish = new Map();
  const svgs = new Map();
  for (const folder of FOLDERS) {
    const abs = path.join(src, folder);
    if (!fs.existsSync(abs)) continue;
    for (const name of fs.readdirSync(abs)) {
      const rel = path.join(folder, name);
      if (!name.endsWith(".md") || EXCLUDE.has(rel.split(path.sep).join("/")))
        continue;
      const file = path.join(abs, name);
      const text = fs.readFileSync(file, "utf8");
      const fm = frontmatter(text, file);
      if (fm && /^publish:\s*false\s*$/m.test(fm[1])) {
        notes.skipped++;
        continue;
      }
      const stem = path.basename(name, ".md");
      // The slug is the stem lowercased with dashes; neither can be masked.
      if (
        matchesAny(stem, patterns) ||
        matchesAny(stem.trim().toLowerCase().replace(/\s+/g, "-"), patterns)
      )
        throw new Error(
          `A redaction pattern matches the file name of ${file}; rename it. Nothing was changed`,
        );
      if (text.includes(SHADE))
        throw new Error(
          `${file} already contains ${SHADE}; nothing was changed`,
        );
      const before = total(hits);
      const out = redactNote(text, fm, patterns, hits);
      assertRedacted(file, [out], patterns);
      publish.set(rel, out);
      if (total(hits) > before) touched.notes++;
      for (const [, url] of text.matchAll(DIAGRAM_REF)) {
        const svg = DIAGRAM.exec(url)?.[1];
        if (
          svg &&
          !svgs.has(svg) &&
          fs.existsSync(path.join(src, "Diagrams", svg))
        )
          svgs.set(svg, path.join(src, "Diagrams", svg));
      }
    }
  }
  // A wrong DEVLOG_DIR would otherwise wipe both targets.
  if (publish.size + notes.skipped === 0)
    throw new Error(`No DevLog notes found in ${src}; nothing was changed`);

  for (const [name, file] of svgs) {
    if (matchesAny(name.replace(/\.svg$/, ""), patterns))
      throw new Error(
        `A redaction pattern matches the file name of ${file}; rename it. Nothing was changed`,
      );
    const text = fs.readFileSync(file, "utf8");
    if (text.includes(SHADE))
      throw new Error(`${file} already contains ${SHADE}; nothing was changed`);
    const before = total(hits);
    const out = redactSvg(stripSvg(text), patterns, hits, encoded);
    assertRedacted(file, [out, decodeEntities(out).text], patterns);
    if (total(hits) > before) touched.diagrams++;
    if (out.includes("data:image/"))
      throw new Error(
        `${file} still embeds a data:image/ payload after redaction; nothing was changed`,
      );
    svgs.set(name, out);
  }

  for (const [rel, text] of publish) {
    fs.mkdirSync(path.join(notesDir, path.dirname(rel)), { recursive: true });
    fs.writeFileSync(path.join(notesDir, rel), text);
    notes.copied++;
  }
  notes.removed = prune(notesDir, new Set(publish.keys()));

  if (svgs.size) fs.mkdirSync(diagramsDir, { recursive: true });
  for (const [name, text] of svgs) {
    fs.writeFileSync(path.join(diagramsDir, name), text);
    diagrams.copied++;
  }
  diagrams.removed = prune(diagramsDir, new Set(svgs.keys()));

  // Line numbers and counts only: never the pattern or the matched text.
  const perPattern = Object.fromEntries(
    patterns.map(({ line }) => [line, hits.get(line) ?? 0]),
  );
  console.log(
    `notes: ${notes.copied} copied, ${notes.skipped} skipped, ${notes.removed} removed; ` +
      `diagrams: ${diagrams.copied} copied, ${diagrams.removed} removed`,
  );
  console.log(
    `redacted: ${total(hits)} matches in ${touched.notes} notes and ${touched.diagrams} diagrams ` +
      `(${encoded.n} entity-encoded in SVGs)`,
  );
  for (const [line, n] of Object.entries(perPattern))
    console.log(`pattern #${line}: ${n}`);
  return { notes, diagrams, redactions: { ...touched, entityEncoded: encoded.n, perPattern },
  };
}

/** The real vault, its patterns file and this repo's two targets. */
export function defaultSync(root) {
  const src =
    process.env.DEVLOG_DIR || path.join(os.homedir(), "Obsidian", "DevLog");
  return syncDevlog({
    src,
    notesDir: path.join(root, "content", "devlog"),
    diagramsDir: path.join(root, "public", "blog", "diagrams"),
    patternsFile:
      process.env.DEVLOG_REDACTIONS ||
      path.join(src, "_meta", "redactions.txt"),
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url))
  defaultSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."));
