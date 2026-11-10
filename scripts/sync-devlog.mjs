#!/usr/bin/env node
// Mirrors the DevLog vault into content/devlog/ (notes) and public/blog/diagrams/
// (the SVGs those notes reference), redacted with the vault's private patterns
// file. `npm run devlog:publish` commits both targets to a public repo, so this
// is the only gate between private text and the world: every check fails closed
// and runs before the first write.
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
// Same link shape and slug rule as src/lib/devlog.ts.
const WIKILINK = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
const slugify = (stem) => stem.trim().toLowerCase().replace(/\s+/g, "-");
const LIST_ITEM = /^[ \t]*(?:[-*+]|\d+\.)[ \t]/;
const DIAGRAM_REF = /!\[[^\]]*\]\(\s*<?([^)\s>]+)/g;
const DIAGRAM = /(?:^|\/)Diagrams\/([^/]+\.svg)$/;
const DATA_URI = /data:[^,\s"'()]*,/i;
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

/** `publish:` takes true or false only (any case, optionally quoted); any `false` holds the note back. */
function unpublished(fm, file) {
  let held = false;
  for (const [, value] of fm?.[1].matchAll(/^publish:(.*)$/gm) ?? []) {
    const v = /^\s*(["']?)(true|false)\1\s*$/i.exec(value);
    if (!v)
      throw new Error(`Invalid publish value in ${file}; use true or false`);
    if (v[2].toLowerCase() === "false") held = true;
  }
  return held;
}

/**
 * One entry per line: exactly `/body/flags` (flags from `dgimsuv`, `g` implied)
 * or a case-sensitive literal. Anything ambiguous throws; errors name the line,
 * never the entry.
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
      const n = i + 1;
      if (line === "" || line.startsWith("#")) return;
      if (/\s$/.test(line))
        throw new Error(`Trailing whitespace on line ${n} of ${file}`);
      if (!line.startsWith("/")) {
        patterns.push({
          line: n,
          re: new RegExp(line.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
        });
        return;
      }
      const m = /^\/(.+)\/([dgimsuv]*)$/.exec(line);
      if (!m)
        throw new Error(
          `Line ${n} of ${file} starts with / but is not /body/flags (flags from dgimsuv)`,
        );
      try {
        patterns.push({
          line: n,
          re: new RegExp(m[1], m[2].includes("g") ? m[2] : m[2] + "g"),
        });
      } catch {
        throw new Error(`Invalid regex on line ${n} of ${file}`);
      }
    });
  if (patterns.length === 0)
    throw new Error(`No redaction patterns in ${file}; nothing was changed`);
  return patterns;
}

/** Length rounded up to a multiple of 4, capped at 24, so the exact length does not leak. */
const mask = (s) =>
  SHADE.repeat(Math.min(24, Math.ceil([...s].length / 4) * 4));

const ENTITY =
  /&(?:(amp|lt|gt|quot|apos|nbsp)|#(\d{1,7})|#[xX]([0-9a-fA-F]{1,6}));/g;
const NAMED = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

/** The text with entities decoded, and each decoded code unit's raw offset (plus one for the end). */
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
 * Collects every pattern's matches on the unmasked text (for an SVG also on
 * the entity-decoded view, mapped back to raw offsets), merges overlapping or
 * touching ranges and masks each merged range once. Counts are per pattern,
 * taken before merging.
 */
function maskText(text, patterns, stats, svg = false) {
  const view = svg ? decodeEntities(text) : null;
  const ranges = [];
  for (const { line, re } of patterns) {
    const found = new Set();
    for (const m of text.matchAll(re))
      if (m[0]) found.add(`${m.index}:${m.index + m[0].length}`);
    const raw = found.size;
    if (view)
      for (const m of view.text.matchAll(re)) {
        const [s, e] = [view.at[m.index], view.at[m.index + m[0].length]];
        if (e > s) found.add(`${s}:${e}`);
      }
    stats.encoded += found.size - raw;
    stats.hits.set(line, (stats.hits.get(line) ?? 0) + found.size);
    for (const r of found) ranges.push(r.split(":").map(Number));
  }
  ranges.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  let out = "";
  let last = 0;
  for (let i = 0; i < ranges.length; ) {
    let [s, e] = ranges[i++];
    while (i < ranges.length && ranges[i][0] <= e)
      e = Math.max(e, ranges[i++][1]);
    // Length of what a reader would see: entities count as one character.
    const seen = svg ? decodeEntities(text.slice(s, e)).text : text.slice(s, e);
    out += text.slice(last, s) + mask(seen);
    last = e;
  }
  return out + text.slice(last);
}

const HEADING = /^ {0,3}(#{1,6})(?:[ \t]|\r?\n|$)/;
const FENCE = /^ {0,3}(`{3,}|~{3,})/;

/**
 * Drops list items whose links all point at held-back notes, then every
 * section (an ATX heading up to the next heading of the same or a higher
 * level) that had list items and has none left, innermost first; masks every
 * other link to a held-back note.
 */
export function hideUnpublished(text, held, counts) {
  const target = (m) => held.has(slugify(m[1]));
  const lines = text.split(/(?<=\n)/).map((line) => ({ line }));
  let fence = null;
  for (const l of lines) {
    const f = FENCE.exec(l.line)?.[1];
    if (fence) {
      if (f && f[0] === fence[0] && f.length >= fence.length) fence = null;
      l.code = true;
    } else if (f) {
      fence = f;
      l.code = true;
    }
    l.level = l.code ? 0 : (HEADING.exec(l.line)?.[1].length ?? 0);
    l.item = !l.code && LIST_ITEM.test(l.line);
    if (!LIST_ITEM.test(l.line)) continue;
    const links = [...l.line.matchAll(WIKILINK)];
    if (links.length && links.every(target)) {
      l.gone = true;
      counts.lines++;
    }
  }
  const headings = lines
    .map((l, i) => i)
    .filter((i) => lines[i].level)
    .sort((a, b) => lines[b].level - lines[a].level);
  for (const i of headings) {
    if (lines[i].gone) continue;
    let j = i + 1;
    while (j < lines.length && !(lines[j].level && lines[j].level <= lines[i].level)) j++;
    const section = lines.slice(i, j);
    const items = section.filter((l) => l.item);
    if (items.length === 0 || items.some((l) => !l.gone)) continue;
    for (const l of section) l.gone = true;
    counts.sections++;
  }
  return lines
    .filter((l) => !l.gone)
    .map((l) => l.line)
    .join("")
    .replace(WIKILINK, (...m) => {
      if (!target(m)) return m[0];
      counts.links++;
      return SHADE.repeat(8);
    });
}

const percentDecode = (s) =>
  s.replace(/(?:%[0-9A-Fa-f]{2})+/g, (m) => {
    try {
      return decodeURIComponent(m);
    } catch {
      return m.replace(/%(..)/g, (_, h) =>
        String.fromCharCode(parseInt(h, 16)),
      );
    }
  });
const VIEW_STEPS = {
  "tags joined": (s) => s.replace(/<[^>]*>/g, ""),
  "tags spaced": (s) => s.replace(/<[^>]*>/g, " "),
  entities: (s) => decodeEntities(s).text,
  "unicode spaces": (s) => s.replace(/[   -   　﻿]/g, " "),
  "whitespace collapsed": (s) => s.replace(/\s+/g, " "),
  "percent decoded": percentDecode,
  "emphasis removed": (s) => s.replace(/\*+|_+|~~|==/g, ""),
};
const chain = (tags) => (s) =>
  [
    "entities",
    "percent decoded",
    tags,
    "unicode spaces",
    "whitespace collapsed",
    "emphasis removed",
  ].reduce((v, step) => VIEW_STEPS[step](v), s);

/**
 * Check-only views of an output file. A term split by markup, an entity, a
 * soft wrap, `%20` or emphasis would slip past the masking patterns; these
 * views join it back up so the backstop can see it.
 */
export const VIEWS = {
  raw: (s) => s,
  ...VIEW_STEPS,
  "all, tags joined": chain("tags joined"),
  "all, tags spaced": chain("tags spaced"),
};

/** Zero-length matches do not count: they mask nothing. */
const hit = (s, re) => [...s.matchAll(re)].some((m) => m[0]);

/** Fail closed: no pattern and no held-back note's stem or slug may show in any view of an output file. */
export function assertClean(file, text, patterns, heldNames) {
  for (const [name, view] of Object.entries(VIEWS)) {
    const v = view(text);
    for (const { line, re } of patterns)
      if (hit(v, re))
        throw new Error(
          `Pattern on line ${line} still matches ${file} (${name} view); nothing was changed`,
        );
    const lower = v.toLowerCase();
    if (heldNames.some((h) => lower.includes(h)))
      throw new Error(
        `${file} still names a held-back note (${name} view); nothing was changed`,
      );
  }
}

/** Drops the private keys, hides links to held-back notes, then masks the values, title and body. */
function redactNote(text, fm, held, stats) {
  const clean = (s) =>
    maskText(hideUnpublished(s, held, stats.hidden), stats.patterns, stats);
  if (!fm) return clean(text);
  const eol = /\r\n/.test(fm[0]) ? "\r\n" : "\n";
  const kept = fm[1]
    .split(/\r?\n/)
    .filter((l) => !DROPPED_KEYS.has(FM_LINE.exec(l)?.[1]))
    .map((l) => l.replace(FM_LINE, (_, k, v) => `${k}:${clean(v)}`));
  const body = clean(text.slice(fm[0].length));
  // An emptied block would no longer parse, so it goes too.
  if (!kept.some((l) => l.trim())) return body;
  const close = fm[0].endsWith("\n") ? eol : "";
  return `---${eol}${kept.join(eol)}${eol}---${close}${body}`;
}

/**
 * Drops comments, draw.io's embedded editable source (the root `content`
 * attribute) and the PNG label fallbacks (the `<image>` after a `<switch>`'s
 * `<foreignObject>`, which browsers never pick), so the only label text left
 * is the text the patterns can reach.
 */
export function stripSvg(svg) {
  return svg
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<svg\b(?:[^>"']|"[^"]*"|'[^']*')*>/, (root) =>
      root.replace(/\scontent\s*=\s*(?:"[^"]*"|'[^']*')/, ""),
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
const nameError = (file) =>
  new Error(
    `A redaction pattern matches the file name of ${file}; rename it. Nothing was changed`,
  );
const shadeError = (file) =>
  new Error(`${file} already contains ${SHADE}; nothing was changed`);

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
  const stats = {
    patterns,
    hits: new Map(),
    encoded: 0,
    hidden: { lines: 0, links: 0, sections: 0 },
  };
  const total = () => [...stats.hits.values()].reduce((a, b) => a + b, 0);
  const touched = { notes: 0, diagrams: 0 };

  const sources = [];
  const held = new Set();
  const heldNames = new Set();
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
      const stem = path.basename(name, ".md");
      if (unpublished(fm, file)) {
        notes.skipped++;
        held.add(slugify(stem));
        heldNames.add(stem.toLowerCase()).add(slugify(stem));
      } else sources.push({ rel, file, text, fm, stem });
    }
  }
  // A wrong DEVLOG_DIR would otherwise wipe both targets.
  if (sources.length + notes.skipped === 0)
    throw new Error(`No DevLog notes found in ${src}; nothing was changed`);

  const publish = new Map();
  const svgs = new Map();
  for (const { rel, file, text, fm, stem } of sources) {
    // The slug is the stem lowercased with dashes; neither can be masked.
    if (matchesAny(stem, patterns) || matchesAny(slugify(stem), patterns))
      throw nameError(file);
    if (text.includes(SHADE)) throw shadeError(file);
    const before = total();
    const out = redactNote(text, fm, held, stats);
    assertClean(path.join(notesDir, rel), out, patterns, [...heldNames]);
    publish.set(rel, out);
    if (total() > before) touched.notes++;
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

  for (const [name, file] of svgs) {
    if (matchesAny(name.replace(/\.svg$/, ""), patterns)) throw nameError(file);
    const text = fs.readFileSync(file, "utf8");
    if (text.includes(SHADE)) throw shadeError(file);
    const before = total();
    const out = maskText(stripSvg(text), patterns, stats, true);
    if (total() > before) touched.diagrams++;
    if (DATA_URI.test(out))
      throw new Error(
        `${file} still embeds a data: URI after redaction; nothing was changed`,
      );
    assertClean(path.join(diagramsDir, name), out, patterns, [...heldNames]);
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

  // Line numbers and counts only: never the pattern, the matched text or a held-back note.
  const perPattern = Object.fromEntries(
    patterns.map(({ line }) => [line, stats.hits.get(line) ?? 0]),
  );
  console.log(
    `notes: ${notes.copied} copied, ${notes.skipped} skipped, ${notes.removed} removed; ` +
      `diagrams: ${diagrams.copied} copied, ${diagrams.removed} removed`,
  );
  console.log(
    `redacted: ${total()} matches in ${touched.notes} notes and ${touched.diagrams} diagrams ` +
      `(${stats.encoded} entity-encoded in SVGs)`,
  );
  console.log(
    `held-back links: ${stats.hidden.lines} list lines dropped, ${stats.hidden.links} links masked, ${stats.hidden.sections} sections removed`,
  );
  for (const [line, n] of Object.entries(perPattern))
    console.log(`pattern #${line}: ${n}`);
  return {
    notes,
    diagrams,
    redactions: { ...touched, entityEncoded: stats.encoded, perPattern },
    hidden: stats.hidden,
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
