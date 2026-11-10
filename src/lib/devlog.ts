// Server-only: reads the synced DevLog notes from disk and renders them.
import fs from "fs";
import path from "path";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSlug from "rehype-slug";
import rehypeShiki from "@shikijs/rehype";
import rehypeStringify from "rehype-stringify";
import { visit, SKIP, EXIT } from "unist-util-visit";
import type {
  Root as MdRoot,
  RootContent,
  PhrasingContent,
  Parent,
} from "mdast";
import type { Root as HastRoot, Element, ElementContent } from "hast";
import { REDACTED_RUN } from "@/components/blog/mosaic";

export const DEVLOG_DIR = path.join(process.cwd(), "content", "devlog");
export const DIAGRAMS_DIR = path.join(
  process.cwd(),
  "public",
  "blog",
  "diagrams",
);
/** One generated illustration per note, `<slug>.webp` at 1200 x 800. */
export const COVERS_DIR = path.join(process.cwd(), "public", "blog", "covers");

// Explorer order; the key is the note's folder relative to the content root.
export const SECTIONS = [
  ["Maps", "Maps"],
  ["Cases/Debug", "Debug cases"],
  ["Cases/Design", "Design cases"],
  ["Techniques", "Techniques"],
  ["Agents", "Lessons"],
  ["Cheatsheets", "Cheatsheets"],
  ["Glossary", "Glossary"],
] as const;

export type Section = (typeof SECTIONS)[number][1];

export type Note = {
  slug: string;
  title: string;
  section: Section;
  type?: string;
  date?: string;
  tags: string[];
  status?: string;
  description: string;
  /** The first paragraph's first highlight, else its first sentence, as plain text. */
  summary: string;
  readingMinutes: number;
  /** Resolved slugs of the notes this one links to, deduplicated. */
  links: string[];
  /** Markdown body with frontmatter and the title heading removed. */
  body: string;
  /** The note's illustration when one is on disk, else its first synced diagram. */
  cover?: {
    kind: "art" | "diagram";
    src: string;
    alt: string;
    width: number;
    height: number;
  };
};

export type TocEntry = { depth: 2 | 3; id: string; text: string };

export function slugify(stem: string): string {
  return stem.trim().toLowerCase().replace(/\s+/g, "-");
}

// Same shapes as the publish check in scripts/sync-devlog.mjs; keep the two in step.
const FM_OPEN = /^\uFEFF?---[ \t]*\r?(?:\n|$)/;
const FM_BLOCK = /^---\r?\n(?:([\s\S]*?)\r?\n)?---\r?(?:\n|$)/;

/**
 * Flat `key: value` frontmatter with inline `[a, b]` arrays. A file that opens
 * with `---` but has no well-formed block (BOM, trailing space, unclosed,
 * empty, a line that is not `key: value`) throws instead of rendering as body.
 */
export function parseFrontmatter(
  src: string,
  file = "<input>",
): {
  data: Record<string, string | string[]>;
  content: string;
} {
  if (!FM_OPEN.test(src)) return { data: {}, content: src };
  const m = FM_BLOCK.exec(src);
  const bad = new Error(`Malformed frontmatter in ${file}`);
  if (!m || !m[1]?.trim()) throw bad;
  const data: Record<string, string | string[]> = {};
  for (const line of (m[1] ?? "").split(/\r?\n/)) {
    if (!line.trim()) continue;
    const kv = /^([A-Za-z_][\w-]*):\s*(.*)$/.exec(line);
    if (!kv) throw bad;
    const raw = kv[2].trim();
    data[kv[1]] = /^\[.*\]$/.test(raw)
      ? raw
          .slice(1, -1)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : raw;
  }
  return { data, content: src.slice(m[0].length) };
}

const WIKILINK = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;

// A private-use character stands in for `=` inside inline code, so `a == b`
// never reads as a highlight marker; built from its code point so it stays visible here.
const CODE_EQ = String.fromCharCode(0xe000);

function plain(node: unknown, guardCode = false): string {
  const n = node as { type?: string; value?: string; children?: unknown[] };
  if (typeof n.value === "string")
    return guardCode && n.type === "inlineCode"
      ? n.value.replace(/=/g, CODE_EQ)
      : n.value;
  return (n.children ?? []).map((c) => plain(c, guardCode)).join("");
}

const HIGHLIGHT = /==(\S(?:.*?\S)?)==/;
// A sentence ends at . ! ? before a space or the end, or at a CJK full stop.
const SENTENCE = /^.+?(?:[.!?](?=\s|$)|[。！？])/;

/** The first highlight (the notebook marks its conclusion that way), else the first sentence. */
function summarize(para: string): string {
  const text = HIGHLIGHT.exec(para)?.[1] ?? SENTENCE.exec(para)?.[0] ?? para;
  return truncate(
    text.replace(/==/g, "").replace(new RegExp(CODE_EQ, "g"), "=").trim(),
    180,
  );
}

const parser = unified().use(remarkParse).use(remarkGfm);

/** Public URL of an image that points into the vault's Diagrams folder. */
function diagramUrl(url: string): string | undefined {
  const m = /(?:^|\/)Diagrams\/([^/]+\.svg)$/.exec(url);
  return m ? `/blog/diagrams/${m[1]}` : undefined;
}

/** Root `width` and `height` (`617px` → 617), else the `viewBox` size. */
function svgSize(svg: string): { width: number; height: number } | undefined {
  const root = /<svg\b[^>]*>/.exec(svg)?.[0] ?? "";
  const attr = (k: string) =>
    Number(
      new RegExp(`\\s${k}\\s*=\\s*["']\\s*([\\d.]+)(?:px)?\\s*["']`).exec(
        root,
      )?.[1],
    );
  const [width, height] = [attr("width"), attr("height")];
  if (width > 0 && height > 0)
    return { width: Math.round(width), height: Math.round(height) };
  const box = /\sviewBox\s*=\s*["']([^"']*)["']/
    .exec(root)?.[1]
    .trim()
    .split(/[\s,]+/)
    .map(Number);
  return box && box[2] > 0 && box[3] > 0
    ? { width: Math.round(box[2]), height: Math.round(box[3]) }
    : undefined;
}

function readNote(
  file: string,
  rel: string,
  section: Section,
  diagrams: string,
  covers: string,
): Note {
  const { data, content } = parseFrontmatter(
    fs.readFileSync(file, "utf8"),
    file,
  );
  const tree = parser.parse(content);
  const h1 = tree.children.findIndex(
    (n) => n.type === "heading" && n.depth === 1,
  );
  const stem = path.basename(rel, ".md");
  let title = stem;
  let body = content;
  if (h1 !== -1) {
    const heading = tree.children[h1];
    title = plain(heading).trim();
    const { start, end } = heading.position!;
    body =
      content.slice(0, start.offset) +
      content.slice(end.offset).replace(/^\r?\n/, "");
    tree.children.splice(h1, 1);
  }
  const firstPara = tree.children.find((n) => n.type === "paragraph");
  // Wikilinks stay in until getNotes knows every title; it finishes the description and summary.
  const description = firstPara
    ? plain(firstPara).replace(/==/g, "").replace(/\s+/g, " ").trim()
    : "";
  const summary = firstPara
    ? plain(firstPara, true).replace(/\s+/g, " ").trim()
    : "";
  const slug = slugify(stem);
  const targets = new Set<string>();
  visit(tree, "text", (t) => {
    for (const m of t.value.matchAll(WIKILINK)) targets.add(slugify(m[1]));
  });
  // The card's title already names the note, so the illustration carries no alt text.
  let cover: Note["cover"] = fs.existsSync(path.join(covers, `${slug}.webp`))
    ? {
        kind: "art",
        src: `/blog/covers/${slug}.webp`,
        alt: "",
        width: 1200,
        height: 800,
      }
    : undefined;
  visit(tree, "image", (img) => {
    if (cover) return EXIT;
    const src = diagramUrl(img.url);
    if (!src) return;
    const svg = path.join(diagrams, path.basename(src));
    const size = fs.existsSync(svg)
      ? svgSize(fs.readFileSync(svg, "utf8"))
      : undefined;
    if (!size) return;
    cover = { kind: "diagram", src, alt: img.alt ?? "", ...size };
    return EXIT;
  });
  const words = body.split(/\s+/).filter(Boolean).length;
  const str = (k: string) =>
    typeof data[k] === "string" ? (data[k] as string) : undefined;
  const tags = data.tags;
  return {
    slug,
    title,
    section,
    type: str("type"),
    date: str("date") || undefined,
    tags: Array.isArray(tags) ? tags : tags ? [tags] : [],
    status: str("status") || undefined,
    description,
    summary,
    readingMinutes: Math.max(1, Math.ceil(words / 200)),
    links: [...targets],
    body,
    cover,
  };
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  const cut = s.slice(0, max - 1);
  return (
    cut.slice(0, cut.lastIndexOf(" ") > 0 ? cut.lastIndexOf(" ") : cut.length) +
    "…"
  );
}

const cache = new Map<string, Note[]>();

/** All notes, newest first (undated notes after dated ones, then by title). */
export function getNotes(
  dir: string = DEVLOG_DIR,
  diagrams: string = DIAGRAMS_DIR,
  covers: string = COVERS_DIR,
): Note[] {
  const key = `${dir}\n${diagrams}\n${covers}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const notes: Note[] = [];
  for (const [folder, section] of SECTIONS) {
    const abs = path.join(dir, folder);
    if (!fs.existsSync(abs)) continue;
    for (const name of fs.readdirSync(abs).sort()) {
      if (!name.endsWith(".md")) continue;
      notes.push(
        readNote(
          path.join(abs, name),
          `${folder}/${name}`,
          section,
          diagrams,
          covers,
        ),
      );
    }
  }
  const seen = new Map<string, Note>();
  for (const n of notes) {
    if (seen.has(n.slug)) throw new Error(`Duplicate DevLog slug "${n.slug}"`);
    seen.set(n.slug, n);
  }
  const titles = new Map(notes.map((n) => [n.slug, n.title]));
  const resolve = (s: string) =>
    s.replace(WIKILINK, (_, t: string, a?: string) =>
      wikilinkLabel(t, a, titles),
    );
  for (const n of notes) {
    // Keep only links that resolve, so the graph and the counts agree.
    n.links = n.links.filter((s) => seen.has(s) && s !== n.slug);
    n.description = truncate(resolve(n.description), 160);
    n.summary = summarize(resolve(n.summary));
  }
  notes.sort(
    (a, b) =>
      (b.date ?? "").localeCompare(a.date ?? "") ||
      a.title.localeCompare(b.title),
  );
  cache.set(key, notes);
  return notes;
}

export function getNote(
  slug: string,
  dir: string = DEVLOG_DIR,
): Note | undefined {
  return getNotes(dir).find((n) => n.slug === slug);
}

export function getBacklinks(slug: string, dir: string = DEVLOG_DIR): Note[] {
  return getNotes(dir).filter((n) => n.links.includes(slug));
}

/** Every tag with its note count, alphabetical. */
export function getTags(
  dir: string = DEVLOG_DIR,
): { tag: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const n of getNotes(dir))
    for (const t of n.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  return [...counts]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => a.tag.localeCompare(b.tag));
}

// ---- rendering ---------------------------------------------------------

type Mark = {
  type: "mark";
  children: PhrasingContent[];
  data: { hName: "mark" };
};

/** An alias wins, then the resolved note's title, then the link's own text. */
function wikilinkLabel(
  target: string,
  alias: string | undefined,
  titles: Map<string, string>,
): string {
  return (alias ?? titles.get(slugify(target)) ?? target).trim();
}

function splitWikilinks(
  value: string,
  titles: Map<string, string>,
): PhrasingContent[] {
  const out: PhrasingContent[] = [];
  let last = 0;
  for (const m of value.matchAll(WIKILINK)) {
    if (m.index > last)
      out.push({ type: "text", value: value.slice(last, m.index) });
    const slug = slugify(m[1]);
    const label = wikilinkLabel(m[1], m[2], titles);
    out.push(
      titles.has(slug)
        ? {
            type: "link",
            url: `/blog/${slug}`,
            children: [{ type: "text", value: label }],
          }
        : { type: "text", value: label },
    );
    last = m.index + m[0].length;
  }
  if (last < value.length) out.push({ type: "text", value: value.slice(last) });
  return out;
}

type Token = PhrasingContent | { marker: true; open: boolean; close: boolean };

/** Pairs `==` markers among one parent's children, so a highlight may span inline code or bold. */
function applyHighlights(children: PhrasingContent[]): PhrasingContent[] {
  const tokens: Token[] = [];
  children.forEach((child, i) => {
    if (child.type !== "text" || !child.value.includes("=="))
      return void tokens.push(child);
    const parts = child.value.split("==");
    parts.forEach((part, j) => {
      if (j > 0) {
        const before = parts[j - 1];
        const after = part;
        const open = after
          ? !/^\s/.test(after)
          : i + 1 < children.length && children[i + 1].type !== "text";
        const close = before
          ? !/\s$/.test(before)
          : i > 0 && children[i - 1].type !== "text";
        tokens.push({ marker: true, open, close });
      }
      if (part) tokens.push({ type: "text", value: part });
    });
  });
  const out: PhrasingContent[] = [];
  let openAt = -1;
  for (const t of tokens) {
    if ("marker" in t) {
      if (openAt !== -1 && t.close && out.length > openAt) {
        const mark: Mark = {
          type: "mark",
          children: out.splice(openAt),
          data: { hName: "mark" },
        };
        out.push(mark as unknown as PhrasingContent);
        openAt = -1;
      } else if (openAt === -1 && t.open) {
        openAt = out.length;
      } else {
        out.push({ type: "text", value: "==" });
      }
    } else out.push(t);
  }
  if (openAt !== -1) out.splice(openAt, 0, { type: "text", value: "==" });
  return out;
}

function remarkDevlog(titles: Map<string, string>) {
  return (tree: MdRoot) => {
    visit(tree, (node, index, parent) => {
      // Raw HTML (e.g. a `<file>` placeholder in prose) renders as literal text.
      if (node.type === "html" && parent && index !== undefined) {
        const text = { type: "text", value: node.value } as const;
        parent.children[index] = (
          parent.type === "root"
            ? { type: "paragraph", children: [text] }
            : text
        ) as RootContent;
        return SKIP;
      }
      // Swap the code node for an empty paragraph shell renamed to a div: a
      // `code` node always comes out of remark-rehype wrapped in <pre>.
      if (
        node.type === "code" &&
        node.lang === "mermaid" &&
        parent &&
        index !== undefined
      ) {
        parent.children[index] = {
          type: "paragraph",
          children: [],
          data: {
            hName: "div",
            hProperties: { className: ["mermaid"] },
            hChildren: [{ type: "text", value: node.value }],
          },
        };
        return SKIP;
      }
      if (node.type === "image") node.url = diagramUrl(node.url) ?? node.url;
    });
    // Code and inlineCode carry `value`, not children, so text rewriting never reaches them.
    visit(tree, (node) => {
      if (!("children" in node)) return;
      const p = node as Parent;
      if (!p.children.some((c) => c.type === "text")) return;
      // A parent with text children holds phrasing content only.
      const kids = (p.children as PhrasingContent[]).flatMap((c) =>
        c.type === "text" ? splitWikilinks(c.value, titles) : [c],
      );
      p.children = applyHighlights(kids) as Parent["children"];
    });
  };
}

function rehypeDevlog(toc: TocEntry[]) {
  return (tree: HastRoot) => {
    visit(tree, "element", (node: Element, index, parent) => {
      if (
        (node.tagName === "h2" || node.tagName === "h3") &&
        node.properties.id
      ) {
        toc.push({
          depth: node.tagName === "h2" ? 2 : 3,
          id: String(node.properties.id),
          text: plain(node).trim(),
        });
      }
      if (node.tagName === "table" && parent && index !== undefined) {
        const wrap: Element = {
          type: "element",
          tagName: "div",
          properties: { className: ["table-wrap"] },
          children: [node],
        };
        parent.children[index] = wrap as ElementContent;
        return SKIP;
      }
      if (node.tagName === "img") {
        node.properties.loading = "lazy";
      }
    });
  };
}

/**
 * Wraps each `▒` run the sync left in place of redacted text, code included
 * (runs after Shiki). Mermaid source stays plain: the client parses it as text.
 */
function rehypeMosaic() {
  return (tree: HastRoot) => {
    visit(tree, "text", (node, index, parent) => {
      if (!parent || index === undefined || !REDACTED_RUN.test(node.value))
        return;
      if (
        parent.type === "element" &&
        (parent.properties.className as string[] | undefined)?.includes(
          "mermaid",
        )
      )
        return;
      const parts = node.value
        .split(REDACTED_RUN)
        .flatMap((value, i): ElementContent[] =>
          !value
            ? []
            : i % 2
              ? [
                  {
                    type: "element",
                    tagName: "span",
                    properties: {
                      className: ["redacted"],
                      role: "img",
                      ariaLabel: "redacted",
                    },
                    children: [{ type: "text", value }],
                  },
                ]
              : [{ type: "text", value }],
        );
      parent.children.splice(index, 1, ...parts);
      return [SKIP, index + parts.length];
    });
  };
}

export async function renderNote(
  note: Note,
  dir: string = DEVLOG_DIR,
): Promise<{ html: string; toc: TocEntry[]; hasMermaid: boolean }> {
  const titles = new Map(getNotes(dir).map((n) => [n.slug, n.title]));
  const toc: TocEntry[] = [];
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(() => remarkDevlog(titles))
    .use(remarkRehype)
    .use(rehypeSlug)
    .use(() => rehypeDevlog(toc))
    .use(rehypeShiki, {
      themes: { light: "github-light", dark: "github-dark" },
      defaultColor: false,
      lazy: true,
      fallbackLanguage: "text",
    })
    .use(rehypeMosaic)
    .use(rehypeStringify)
    .process(note.body);
  const html = String(file);
  return { html, toc, hasMermaid: html.includes('<div class="mermaid">') };
}
