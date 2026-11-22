// @vitest-environment node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { beforeEach, afterEach, describe, expect, it } from "vitest";
import { getBacklinks, getNote, getNotes, getTags, renderNote } from "./devlog";

let root: string;

const write = (rel: string, text: string) => {
  const file = path.join(root, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
};

const source = (locale: "en" | "zh-Hans") => ({
  locale,
  dir: path.join(root, "notes"),
  diagrams: path.join(root, "diagrams"),
  covers: path.join(root, "covers"),
});

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), "devlog-locale-"));
  write("notes/Techniques/pump.md", "# Pump timing\n\nEnglish article.\n");
  write("notes/Techniques/valve.md", "# Valve sizing\n\nEnglish only.\n");
  write("notes/zh/Techniques/pump.md", "# 水泵计时\n\n简体中文。\n");
});

afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

describe("DevLog locales", () => {
  it("caches and checks duplicate slugs per edition", () => {
    expect(getNotes(source("en")).map((n) => n.slug)).toEqual(["pump", "valve"]);
    expect(getNotes(source("zh-Hans")).map((n) => n.slug)).toEqual(["pump"]);
    expect(getNote("pump", source("en"))?.title).toBe("Pump timing");
    expect(getNote("pump", source("zh-Hans"))?.title).toBe("水泵计时");

    write("notes/zh/Glossary/Pump.md", "# 同名\n");
    expect(() => getNotes({ ...source("zh-Hans"), diagrams: root })).toThrow(
      'Duplicate DevLog slug "pump"',
    );
  });

  it("resolves path links in summaries, graph and markup with Chinese-first fallback", async () => {
    write(
      "notes/zh/Maps/layout.md",
      "---\ntags: [reference, 中文]\n---\n# 布局\n\n" +
        "参见 [[zh/Techniques/pump|pump]]、[[zh/Techniques/valve|valve]] 和 [[zh/Maps/gauge|gauge]]。\n\n" +
        "还有 [[zh/Techniques/pump|自定义名称]] 和 `[[zh/Techniques/pump|pump]]`。\n",
    );
    const zh = source("zh-Hans");
    const note = getNote("layout", zh)!;
    expect(note.summary).toBe("参见 水泵计时、Valve sizing 和 gauge。");
    expect(note.description).toBe(note.summary);
    expect(note.links).toEqual(["pump", "valve"]);
    expect(getBacklinks("pump", zh).map((n) => n.slug)).toEqual(["layout"]);
    expect(getBacklinks("pump", source("en"))).toEqual([]);
    expect(getTags(zh)).toContainEqual({ tag: "中文", count: 1 });

    const { html } = await renderNote(note, zh);
    expect(html).toContain('<a href="/blog/zh/pump">水泵计时</a>');
    expect(html).toContain('<a href="/blog/valve">Valve sizing</a>');
    expect(html).toContain('和 gauge。');
    expect(html).not.toContain('/blog/zh/gauge');
    expect(html).toContain('<a href="/blog/zh/pump">自定义名称</a>');
    expect(html).toContain('<code>[[zh/Techniques/pump|pump]]</code>');
  });

  it("normalizes extensions, heading and block targets and table-escaped aliases", async () => {
    write("notes/zh/Maps/targets.md", "# 目标\n\n" +
      "[[zh/Techniques/pump.md#步骤|pump]]、[[zh/Techniques/valve.md^step|valve]]。\n\n" +
      "| 术语 |\n| --- |\n| [[zh/Techniques/pump\\|水泵]] |\n");
    const zh = source("zh-Hans");
    const note = getNote("targets", zh)!;
    const { html } = await renderNote(note, zh);

    expect(note.links).toEqual(["pump", "valve"]);
    expect(note.summary).toBe("水泵计时、Valve sizing。");
    expect(html).toContain('<a href="/blog/zh/pump">水泵计时</a>');
    expect(html).toContain('<a href="/blog/valve">Valve sizing</a>');
    expect(html).toContain('<td><a href="/blog/zh/pump">水泵</a></td>');
  });

  it("uses localized diagrams in body and covers, and shares a cover illustration by slug", async () => {
    for (const folder of ["notes", "notes/zh"]) {
      write(`${folder}/Techniques/pump.md`, "# Pump\n\n![示意图](../Diagrams/pump.svg)\n");
      write(`${folder}/Techniques/valve.md`, "# Valve\n\n![配图](../Diagrams/pump.svg)\n");
    }
    write("diagrams/pump.svg", '<svg width="120" height="80"/>');
    write("diagrams/zh/pump.svg", '<svg width="240" height="100"/>');
    write("covers/valve.webp", "");
    const zh = source("zh-Hans");
    const en = source("en");
    const note = getNote("pump", zh)!;

    expect(note.cover).toMatchObject({
      kind: "diagram", src: "/blog/diagrams/zh/pump.svg", width: 240, height: 100,
    });
    expect((await renderNote(note, zh)).html).toContain('src="/blog/diagrams/zh/pump.svg"');
    expect(getNote("pump", en)?.cover).toMatchObject({
      src: "/blog/diagrams/pump.svg", width: 120,
    });
    expect(getNote("valve", zh)?.cover).toEqual(getNote("valve", en)?.cover);
    expect(getNote("valve", zh)?.cover?.src).toBe("/blog/covers/valve.webp");
  });

  it("uses an existing English SVG when the Chinese figure is missing, and keeps unavailable figures as text", async () => {
    write("notes/zh/Techniques/pump.md", "# 水泵\n\n" +
      "![原图](../Diagrams/pump.svg)\n\n![暂无图示](../Diagrams/absent.svg)\n");
    write("diagrams/pump.svg", '<svg width="120" height="80"/>');
    const zh = source("zh-Hans");
    const note = getNote("pump", zh)!;

    expect(note.cover).toMatchObject({
      kind: "diagram", src: "/blog/diagrams/pump.svg", width: 120, height: 80,
    });
    const { html } = await renderNote(note, zh);
    expect(html).toContain('<img src="/blog/diagrams/pump.svg" alt="原图"');
    expect(html).toContain("<p>暂无图示</p>");
    expect(html).not.toContain("absent.svg");
  });

  it("truncates Chinese by code point and computes reading time from Han characters", () => {
    const body = "可以用 API " + "测量".repeat(405);
    write("notes/zh/Techniques/pump.md", `# 水泵计时\n\n${body}。\n`);
    const n = getNote("pump", source("zh-Hans"))!;
    expect(n.summary).toBe([...body].slice(0, 179).join("") + "…");
    expect(n.description).toBe([...body].slice(0, 159).join("") + "…");
    expect(n.readingMinutes).toBe(3);
    expect(n.summary).toContain("API 测量");
  });
});
