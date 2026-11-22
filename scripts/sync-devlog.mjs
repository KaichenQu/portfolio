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

const readVaultFile = (file) =>
  fs.readFileSync(file, {
    encoding: "utf8",
    flag: fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW,
  });

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
const linkStem = (target) =>
  path.posix.basename(
    target.trim().replace(/\\$/, "").split(/[#^]/, 1)[0].trim().replace(/\.md$/i, ""),
  );
// Include malformed spans so text masking cannot expose their aliases either.
const WIKILINK_SPAN = /\[\[[\s\S]*?(?:\]\]|$)/g;
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

/**
 * `publish:` takes true or false only (any case, optionally quoted). Returns
 * why the note is held back: "false" for any `publish: false`, "review" for a
 * case (under `Cases/`, or `type: case-*` elsewhere) with no `publish:` line,
 * because a case's story can be the sensitive part and no pattern sees that.
 * An explicit true is tracked separately for the translation review gate.
 */
function publishDecision(fm, file, rel, requireCaseReview) {
  const values = [...(fm?.[1].matchAll(/^publish:(.*)$/gm) ?? [])].map(
    ([, value]) => {
      const v = /^\s*(["']?)(true|false)\1\s*$/i.exec(value);
      if (!v)
        throw new Error(`Invalid publish value in ${file}; use true or false`);
      return v[2].toLowerCase();
    },
  );
  if (values.includes("false")) return { reason: "false", approved: false };
  // The folder catches a missing or misspelt type; quoted or odd-cased types
  // count too. A false hit only holds a note.
  const isCase =
    rel.split(path.sep)[0] === "Cases" ||
    /^type:\s*["']?case-/im.test(fm?.[1] ?? "");
  return {
    reason: requireCaseReview && !values.length && isCase ? "review" : null,
    approved: values.includes("true"),
  };
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
  readVaultFile(file)
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
  const target = (m) => held.has(slugify(linkStem(m[1])));
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
    while (
      j < lines.length &&
      !(lines[j].level && lines[j].level <= lines[i].level)
    )
      j++;
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

function heldNamePattern(names) {
  if (names.size === 0) return undefined;
  const namesEscaped = [...names]
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)
    .map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  if (!namesEscaped.length) return undefined;
  // Dashes and underscores belong to the stem, e.g. "retry-budget".
  return new RegExp(`(?<![\\w-])(?:${namesEscaped.join("|")})(?![\\w-])`, "gi");
}

const heldNameError = (file, view) =>
  new Error(`${file} still names a held-back note (${view} view); nothing was changed`);

/** Fail closed: no pattern and no held-back note's stem or slug may show in any view of an output file. */
export function assertClean(file, text, patterns, heldNames) {
  const names = heldNamePattern(new Set(heldNames));
  for (const [name, view] of Object.entries(VIEWS)) {
    const v = view(text);
    for (const { line, re } of patterns)
      if (hit(v, re))
        throw new Error(
          `Pattern on line ${line} still matches ${file} (${name} view); nothing was changed`,
        );
    if (names && hit(v, names)) throw heldNameError(file, name);
  }
}

const WIKI_OR_INLINE_CODE = /\[\[[\s\S]*?(?:\]\]|$)|(?<!`)(`+)(?!`)[\s\S]*?(?<!`)\1(?!`)/g;

function maskProseMentions(text, names) {
  const maskProse = (prose) => {
    let out = "";
    let start = 0;
    for (const span of prose.matchAll(WIKI_OR_INLINE_CODE)) {
      out += prose.slice(start, span.index).replace(names, SHADE.repeat(8)) + span[0];
      start = span.index + span[0].length;
    }
    return out + prose.slice(start).replace(names, SHADE.repeat(8));
  };

  let out = "";
  let prose = "";
  let fence = null;
  for (const line of text.split(/(?<=\n)/)) {
    const marker = FENCE.exec(line)?.[1];
    // An indented line may be a code block or a list continuation.
    // Leaving it to the final check avoids masking any code by accident.
    if (!fence && !marker && !/^(?: {4}|\t)/.test(line)) {
      prose += line;
      continue;
    }
    out += maskProse(prose) + line;
    prose = "";
    if (!fence) fence = marker ?? null;
    else if (
      marker?.[0] === fence[0] &&
      marker.length >= fence.length &&
      line.trim() === marker
    ) fence = null;
  }
  return out + maskProse(prose);
}

/** Drops the private keys, hides links to held-back notes, then masks the values, title and body. */
function redactNote({ text, fm, file }, held, stats, names, maskMentions) {
  const clean = (s) => {
    const visible = hideUnpublished(s, held, stats.hidden);
    // Check the remaining link spans before a pattern can mask their target
    // and leave a private alias behind.
    if (names) {
      for (const [name, view] of Object.entries(VIEWS))
        for (const [span] of view(visible).matchAll(WIKILINK_SPAN))
          if (hit(span, names)) throw heldNameError(file, name);
    }
    const out = maskText(visible, stats.patterns, stats);
    return maskMentions && names ? maskProseMentions(out, names) : out;
  };
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

const symlinkError = (file) =>
  new Error(`Symbolic link at ${file}; nothing was changed`);

function checkedStat(file) {
  const info = fs.lstatSync(file, { throwIfNoEntry: false });
  if (info?.isSymbolicLink()) throw symlinkError(file);
  return info;
}

function directoryExists(dir) {
  const info = checkedStat(dir);
  if (!info) return false;
  if (!info.isDirectory()) throw new Error(`Expected a directory at ${dir}; nothing was changed`);
  return true;
}

function sourceFolder(root, relative) {
  let dir = root;
  for (const segment of path.normalize(relative).split(path.sep)) {
    dir = path.join(dir, segment);
    if (!directoryExists(dir)) return undefined;
  }
  return dir;
}

function listFiles(dir) {
  if (!directoryExists(dir)) return [];
  const files = [];
  for (const entry of fs.readdirSync(dir, { recursive: true, withFileTypes: true })) {
    const file = path.join(entry.parentPath, entry.name);
    if (entry.isSymbolicLink()) throw symlinkError(file);
    if (entry.isFile()) files.push(path.relative(dir, file));
  }
  return files;
}

const matchesAny = (s, patterns) => patterns.some(({ re }) => hit(s, re));
const nameError = (file) =>
  new Error(
    `A redaction pattern matches the file name of ${file}; rename it. Nothing was changed`,
  );
const shadeError = (file) =>
  new Error(`${file} already contains ${SHADE}; nothing was changed`);

function readSources(dir, requireCaseReview) {
  const sources = new Map();
  for (const folder of FOLDERS) {
    const abs = sourceFolder(dir, folder);
    if (!abs) continue;
    for (const name of fs.readdirSync(abs).sort()) {
      const rel = path.join(folder, name);
      const file = path.join(abs, name);
      const info = checkedStat(file);
      if (!name.endsWith(".md") || EXCLUDE.has(rel.split(path.sep).join("/")))
        continue;
      if (!info?.isFile()) throw new Error(`Expected a note file at ${file}; nothing was changed`);
      const stem = path.basename(name, ".md");
      if (slugify(stem) === "zh")
        throw new Error(`Reserved DevLog slug "zh" in ${file}; nothing was changed`);
      const text = readVaultFile(file);
      const fm = frontmatter(text, file);
      const decision = publishDecision(fm, file, rel, requireCaseReview);
      sources.set(rel, { file, text, fm, stem, ...decision });
    }
  }
  return sources;
}

function redactionStats(patterns) {
  return {
    patterns,
    hits: new Map(),
    encoded: 0,
    hidden: { lines: 0, links: 0, sections: 0 },
  };
}

const total = (stats) => [...(stats?.hits.values() ?? [])].reduce((a, b) => a + b, 0);

function diagramRefs(text) {
  const refs = new Set();
  for (const [, url] of text.matchAll(DIAGRAM_REF)) {
    const name = DIAGRAM.exec(url)?.[1];
    if (name) refs.add(name);
  }
  return refs;
}

function addStats(stats, entry) {
  for (const [line, n] of entry.stats.hits)
    stats.hits.set(line, (stats.hits.get(line) ?? 0) + n);
  stats.encoded += entry.stats.encoded;
  for (const key of Object.keys(stats.hidden)) stats.hidden[key] += entry.stats.hidden[key];
}

function prepareNote(source, patterns, held, names, maskMentions = false) {
  const { file, text, stem } = source;
  // The slug is the stem lowercased with dashes; neither can be masked.
  if (matchesAny(stem, patterns) || matchesAny(slugify(stem), patterns))
    throw nameError(file);
  if (text.includes(SHADE)) throw shadeError(file);
  const stats = redactionStats(patterns);
  const out = redactNote(source, held, stats, names, maskMentions);
  return { out, refs: diagramRefs(text), stats };
}

function redactDiagram(text, patterns) {
  const stats = redactionStats(patterns);
  const out = maskText(stripSvg(text), patterns, stats, true);
  return { out, stats };
}

function diagramFolder(root) {
  const dir = sourceFolder(root, "Diagrams");
  if (dir)
    for (const entry of fs.readdirSync(dir, { withFileTypes: true }))
      if (entry.isSymbolicLink()) throw symlinkError(path.join(dir, entry.name));
  return dir;
}

function prepareDiagrams(dir, notes, patterns) {
  const diagrams = new Map();
  if (!dir) return diagrams;
  for (const { refs } of notes.values()) {
    for (const name of refs) {
      const file = path.join(dir, name);
      if (diagrams.has(name) || !checkedStat(file)?.isFile()) continue;
      if (matchesAny(name.replace(/\.svg$/, ""), patterns)) throw nameError(file);
      const text = readVaultFile(file);
      if (text.includes(SHADE)) throw shadeError(file);
      const entry = redactDiagram(text, patterns);
      if (DATA_URI.test(entry.out))
        throw new Error(
          `${file} still embeds a data: URI after redaction; nothing was changed`,
        );
      diagrams.set(name, entry);
    }
  }
  return diagrams;
}

function hasDeficit(original, translation) {
  return [...(original?.stats.hits ?? [])].some(
    ([line, n]) => n > (translation?.stats.hits.get(line) ?? 0),
  );
}

function checkEdition(notesDir, diagramsDir, notes, diagrams, patterns, heldNames) {
  const stats = redactionStats(patterns);
  const touched = { notes: 0, diagrams: 0 };
  for (const [dir, entries, kind] of [
    [notesDir, notes, "notes"],
    [diagramsDir, diagrams, "diagrams"],
  ]) {
    for (const [rel, entry] of entries) {
      assertClean(path.join(dir, rel), entry.out, patterns, heldNames);
      if (total(entry.stats) > 0) touched[kind]++;
      addStats(stats, entry);
    }
  }
  return { stats, touched };
}

function writeEdition(dir, entries, existing) {
  for (const [rel, { out }] of entries) {
    const file = path.join(dir, rel);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, out);
  }
  let removed = 0;
  for (const rel of existing) {
    if (entries.has(rel)) continue;
    fs.rmSync(path.join(dir, rel));
    removed++;
  }
  return removed;
}

/** Returns the counts it also prints. Reads, checks and redacts everything before the first write. */
export function syncDevlog({
  src,
  notesDir,
  diagramsDir,
  patternsFile = path.join(src, "_meta", "redactions.txt"),
}) {
  src = path.resolve(src);
  if (!directoryExists(src)) throw new Error(`DevLog vault not found: ${src}`);
  const patternsRel = path.relative(src, patternsFile);
  if (patternsRel !== ".." && !patternsRel.startsWith(`..${path.sep}`))
    sourceFolder(src, path.dirname(patternsRel));
  checkedStat(patternsFile);
  const patterns = loadPatterns(patternsFile);
  const sources = readSources(src, true);
  // A wrong DEVLOG_DIR would otherwise wipe both targets.
  if (!sources.size)
    throw new Error(`No DevLog notes found in ${src}; nothing was changed`);

  const held = new Set();
  const heldNames = new Set();
  const publicSlugs = new Set();
  let heldForReview = 0;
  let skipped = 0;
  for (const { stem, reason } of sources.values()) {
    if (!reason) {
      publicSlugs.add(slugify(stem));
      continue;
    }
    skipped++;
    if (reason === "review") heldForReview++;
    held.add(slugify(stem));
    heldNames.add(stem.toLowerCase()).add(slugify(stem));
  }

  const englishNames = heldNamePattern(heldNames);
  const publish = new Map();
  for (const [rel, source] of sources)
    if (!source.reason)
      publish.set(rel, prepareNote(source, patterns, held, englishNames));
  const enDiagramFolder = diagramFolder(src);
  const svgs = prepareDiagrams(enDiagramFolder, publish, patterns);

  const zhSrc = sourceFolder(src, "zh");
  const zhNotesDir = path.join(notesDir, "zh");
  const zhDiagramsDir = path.join(diagramsDir, "zh");
  const zhSources = zhSrc ? readSources(zhSrc, false) : new Map();
  const zhDiagramFolder = zhSrc ? diagramFolder(zhSrc) : undefined;
  const existingNotes = listFiles(notesDir);
  const existingDiagrams = listFiles(diagramsDir);
  const inChinese = (rel) => rel.startsWith(`zh${path.sep}`);
  const chineseRel = (rel) => path.relative("zh", rel);
  const existingZhNotes = existingNotes.filter(inChinese).map(chineseRel);
  const existingZhDiagrams = existingDiagrams.filter(inChinese).map(chineseRel);
  if (!zhSources.size && (existingZhNotes.length || existingZhDiagrams.length))
    throw new Error(`No Chinese DevLog notes found in ${path.join(src, "zh")}; nothing was changed`);

  const zhHeld = new Set(held);
  const zhHeldNames = new Set(heldNames);
  const zhEligible = new Map();
  const reviewHeld = [];
  for (const [rel, source] of zhSources) {
    const twin = publish.get(rel);
    if (!twin) {
      const slug = slugify(source.stem);
      if (!publicSlugs.has(slug)) {
        zhHeld.add(slug);
        zhHeldNames.add(source.stem.toLowerCase()).add(slug);
      }
      continue;
    }
    if (source.reason) continue;
    const needsReview =
      total(twin.stats) > 0 || [...twin.refs].some((name) => total(svgs.get(name)?.stats) > 0);
    if (needsReview && !source.approved) reviewHeld.push(rel);
    else zhEligible.set(rel, source);
  }

  const chineseNames = heldNamePattern(zhHeldNames);
  const zhPublish = new Map(
    [...zhEligible].map(([rel, source]) => [
      rel, prepareNote(source, patterns, zhHeld, chineseNames, true),
    ]),
  );
  const zhCandidateSvgs = prepareDiagrams(zhDiagramFolder, zhPublish, patterns);
  const originalSvgs = new Map(svgs);
  if (enDiagramFolder) {
    for (const { refs } of zhPublish.values()) {
      for (const name of refs) {
        if (originalSvgs.has(name)) continue;
        const file = path.join(enDiagramFolder, name);
        // An extra localized figure can also have a same-name English source.
        const original = checkedStat(file)?.isFile()
          ? redactDiagram(readVaultFile(file), patterns)
          : undefined;
        originalSvgs.set(name, original);
      }
    }
  }
  const parityHeld = [];
  for (const [rel, candidate] of zhPublish) {
    const twin = publish.get(rel);
    const refs = diagramRefs(candidate.out);
    // Each figure must meet parity on its own. A missing or dropped figure
    // contributes zero matches, regardless of the matches in other files.
    const lacksFigureMatches = [...new Set([...twin.refs, ...refs])].some((name) =>
      hasDeficit(originalSvgs.get(name), refs.has(name) ? zhCandidateSvgs.get(name) : undefined),
    );
    if (hasDeficit(twin, candidate) || lacksFigureMatches) {
      parityHeld.push(rel);
      zhPublish.delete(rel);
    }
  }

  const zhSvgs = new Map();
  for (const { out } of zhPublish.values())
    for (const name of diagramRefs(out))
      if (zhCandidateSvgs.has(name)) zhSvgs.set(name, zhCandidateSvgs.get(name));

  const { stats, touched } = checkEdition(
    notesDir, diagramsDir, publish, svgs, patterns, [...heldNames],
  );
  const zh = checkEdition(
    zhNotesDir, zhDiagramsDir, zhPublish, zhSvgs, patterns, [...zhHeldNames],
  );

  const notes = {
    copied: publish.size,
    skipped,
    removed: writeEdition(notesDir, publish, existingNotes.filter((rel) => !inChinese(rel))),
  };
  const diagrams = {
    copied: svgs.size,
    removed: writeEdition(diagramsDir, svgs, existingDiagrams.filter((rel) => !inChinese(rel))),
  };
  const chinese = {
    notes: {
      copied: zhPublish.size,
      skipped: zhSources.size - zhPublish.size,
      removed: writeEdition(zhNotesDir, zhPublish, existingZhNotes),
    },
    diagrams: { copied: zhSvgs.size, removed: writeEdition(zhDiagramsDir, zhSvgs, existingZhDiagrams) },
    reviewHeld,
    parityHeld,
  };

  // Line numbers and counts only: never the pattern, the matched text or a held-back note.
  const perPattern = Object.fromEntries(
    patterns.map(({ line }) => [line, stats.hits.get(line) ?? 0]),
  );
  console.log(
    `notes: ${notes.copied} copied, ${notes.skipped} skipped, ${notes.removed} removed; ` +
      `diagrams: ${diagrams.copied} copied, ${diagrams.removed} removed`,
  );
  console.log(`held for review: ${heldForReview}`);
  console.log(
    `redacted: ${total(stats)} matches in ${touched.notes} notes and ${touched.diagrams} diagrams ` +
      `(${stats.encoded} entity-encoded in SVGs)`,
  );
  console.log(
    `held-back links: ${stats.hidden.lines} list lines dropped, ${stats.hidden.links} links masked, ${stats.hidden.sections} sections removed`,
  );
  for (const [line, n] of Object.entries(perPattern))
    console.log(`pattern #${line}: ${n}`);
  console.log(
    `Chinese notes: ${chinese.notes.copied} copied, ${chinese.notes.skipped} skipped, ${chinese.notes.removed} removed; ` +
      `Chinese diagrams: ${chinese.diagrams.copied} copied, ${chinese.diagrams.removed} removed`,
  );
  console.log(`Chinese held for review: ${reviewHeld.length}`);
  for (const rel of reviewHeld) console.log(`  ${rel}`);
  console.log(`Chinese held for redaction parity: ${parityHeld.length}`);
  for (const rel of parityHeld) console.log(`  ${rel}`);
  console.log(
    `Chinese redacted: ${total(zh.stats)} matches in ${zh.touched.notes} notes and ${zh.touched.diagrams} diagrams ` +
      `(${zh.stats.encoded} entity-encoded in SVGs)`,
  );
  console.log(
    `Chinese held-back links: ${zh.stats.hidden.lines} list lines dropped, ${zh.stats.hidden.links} links masked, ${zh.stats.hidden.sections} sections removed`,
  );
  return {
    notes,
    chinese,
    heldForReview,
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
