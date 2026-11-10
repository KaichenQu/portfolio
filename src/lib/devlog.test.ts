// @vitest-environment node
import { describe, it, expect } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import {
  getBacklinks,
  getNote,
  getNotes,
  getTags,
  parseFrontmatter,
  renderNote,
  slugify,
} from "./devlog";

const DIR = path.join(__dirname, "__fixtures__", "devlog");
const DUP = path.join(__dirname, "__fixtures__", "devlog-dup");
const CASE = "2026-01-02-widget-cache-goes-stale";

const render = async (slug: string) => renderNote(getNote(slug, DIR)!, DIR);

describe("parseFrontmatter", () => {
  it("reads flat keys, inline arrays and strips the block", () => {
    const { data, content } = parseFrontmatter(
      "---\ntype: case-debug\ntags: [a, b-c]\nlinks: [PR #1, PR #2]\n---\n# T\n",
    );
    expect(data).toEqual({
      type: "case-debug",
      tags: ["a", "b-c"],
      links: ["PR #1", "PR #2"],
    });
    expect(content).toBe("# T\n");
  });

  it("returns the source untouched without frontmatter", () => {
    expect(parseFrontmatter("# T\n")).toEqual({ data: {}, content: "# T\n" });
    expect(parseFrontmatter("----\n# T\n").data).toEqual({});
  });

  it.each([
    ["a BOM", "\uFEFF---\ntype: x\n---\n# T\n"],
    ["no lines", "---\n---\n# T\n"],
    ["only blank lines", "---\n\n  \n---\n# T\n"],
    ["a trailing space", "--- \ntype: x\n---\n# T\n"],
    ["no closing line", "---\ntype: x\n# T\n"],
    ["a line that is not key: value", "---\ntags:\n  - a\n---\n# T\n"],
  ])("throws with the file path on a block with %s", (_, src) => {
    expect(() => parseFrontmatter(src, "x/bad.md")).toThrow(
      "Malformed frontmatter in x/bad.md",
    );
  });

  it("names the note file when a note's block is malformed", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "devlog-fm-"));
    const bad = path.join(tmp, "Glossary", "bad.md");
    fs.mkdirSync(path.dirname(bad));
    fs.writeFileSync(bad, "---\ntype: x\n");
    try {
      expect(() => getNotes(tmp)).toThrow(`Malformed frontmatter in ${bad}`);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
});

describe("notes", () => {
  it("lowercases slugs and turns spaces into dashes", () => {
    expect(slugify("Retry budget")).toBe("retry-budget");
    expect(slugify("CI-CD")).toBe("ci-cd");
    expect(getNote("retry-budget", DIR)?.title).toBe("Retry budget");
  });

  it("maps fields and drops private frontmatter", () => {
    const note = getNote(CASE, DIR)!;
    expect(note).toMatchObject({
      title: "Widget cache goes stale",
      section: "Debug cases",
      type: "case-debug",
      date: "2026-01-02",
      tags: ["debug", "frontend", "cache"],
      status: "solved",
    });
    expect(note).not.toHaveProperty("project");
    expect(note).not.toHaveProperty("links", ["PR #1"]);
    expect(note.body).not.toMatch(/^# /m);
    expect(note.description).toBe(
      "The widget showed old data after a refresh; see Retry with backoff and entity tag for background. Replace <file> with the path.",
    );
  });

  it("caps the description at 160 characters on a word boundary", () => {
    const d = getNote("retry-with-backoff", DIR)!.description;
    expect(d.length).toBeLessThanOrEqual(160);
    expect(d.endsWith("…")).toBe(true);
    expect(d).not.toMatch(/\s…$/);
  });

  it("sorts newest first and lists tags with counts", () => {
    expect(
      getNotes(DIR)
        .slice(0, 2)
        .map((n) => n.slug),
    ).toEqual(["2026-02-10-splitting-the-queue", CASE]);
    expect(getTags(DIR)).toContainEqual({ tag: "cache", count: 2 });
  });

  it("builds backlinks from resolved wikilinks only", () => {
    expect(
      getBacklinks(CASE, DIR)
        .map((n) => n.slug)
        .sort(),
    ).toEqual(["2026-02-10-splitting-the-queue", "caching"]);
    expect(getNote("caching", DIR)!.links).toEqual([
      CASE,
      "retry-with-backoff",
    ]);
    expect(getNote(CASE, DIR)!.links).not.toContain("not-written-yet");
  });

  it("throws on duplicate slugs", () => {
    expect(() => getNotes(DUP)).toThrow(/Duplicate DevLog slug "gadget"/);
  });

  it("returns nothing for a missing directory", () => {
    expect(getNotes(path.join(DIR, "missing"))).toEqual([]);
  });
});

describe("renderNote", () => {
  it("resolves wikilinks, aliases and unresolved targets", async () => {
    const { html } = await render(CASE);
    expect(html).toContain(
      '<a href="/blog/retry-with-backoff">Retry with backoff</a>',
    );
    expect((await render("caching")).html).toContain(
      `<a href="/blog/${CASE}">Widget cache goes stale</a>`,
    );
    expect(html).toContain('<a href="/blog/etag">entity tag</a>');
    expect(html).toContain("A missing link: not-written-yet.");
    expect(html).toContain('<td>see <a href="/blog/etag">ETag</a></td>');
  });

  it("turns ==x== into <mark>, across inline code", async () => {
    const { html } = await render(CASE);
    expect(html).toContain(
      "<mark>The cache key ignored the <code>locale</code> field</mark>",
    );
  });

  it("leaves code blocks and inline code untouched", async () => {
    const { html } = await render(CASE);
    expect(html).toContain("<code>[[ETag]]</code>");
    expect(html).toContain("<code>==x==</code>");
    expect(html).toMatch(/\[\[ETag\]\] and ==not a highlight==/);
    expect(html).not.toContain("<mark>not a highlight</mark>");
  });

  it("escapes angle-bracket placeholders in prose", async () => {
    const { html } = await render(CASE);
    expect(html).toContain("Replace &#x3C;file> with the path.");
    expect(html).not.toContain("<file>");
  });

  it("rewrites diagram paths and wraps tables", async () => {
    const { html } = await render(CASE);
    expect(html).toContain(
      'src="/blog/diagrams/2026-01-02-widget-cache-goes-stale.flow.svg"',
    );
    expect(html).toContain('<div class="table-wrap"><table>');
  });

  it("hands Mermaid source to the client untouched by Shiki", async () => {
    const { html, hasMermaid } = await render(CASE);
    expect(hasMermaid).toBe(true);
    expect(html).toContain(
      '<div class="mermaid">flowchart LR\n  A[client] -->|read| B[(cache)]</div>',
    );
    expect(html).not.toMatch(/<pre[^>]*>\s*<div class="mermaid">/);
    expect((await render("caching")).hasMermaid).toBe(false);
  });

  it("collects h2 and h3 for the table of contents and highlights code", async () => {
    const { html, toc } = await render(CASE);
    expect(toc).toEqual([
      { depth: 2, id: "root-cause", text: "Root cause" },
      { depth: 3, id: "fix-steps", text: "Fix steps" },
    ]);
    expect(html).toContain(
      'class="shiki shiki-themes github-light github-dark"',
    );
  });
});
