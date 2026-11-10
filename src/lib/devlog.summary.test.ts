// @vitest-environment node
import { afterAll, describe, expect, it } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { getNotes } from "./devlog";

const root = fs.mkdtempSync(path.join(os.tmpdir(), "devlog-summary-"));
const DIR = path.join(root, "devlog");
const note = (name: string, body: string) => {
  const file = path.join(DIR, "Glossary", `${name}.md`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `# ${name}\n\n${body}\n`);
};

note("target", "The target note.");
note(
  "highlight",
  "Some setup first. Then **more** context. ==The *cause* was [[target]] holding `a == b` open.== Trailing words.\n\nSecond paragraph.",
);
note(
  "sentence",
  "A [[target|linked]] note with **bold**, `code` and _emphasis_. Second sentence here.",
);
note("no-stop", "Post a screenshot and the bot replies:\n\nNext paragraph.");
note("cjk", "第一句话说明结论。第二句补充细节。");
note("masked", "On the ▒▒▒▒ stack every request hung. Then it failed.");
note("code-eq", "Compare `x === y` inside code. Then more.");
note(
  "long",
  "==" +
    "word ".repeat(60).trim() +
    "== and the rest.",
);
note("empty", "```\nonly code\n```");

const summary = (slug: string) =>
  getNotes(DIR, path.join(root, "none"), path.join(root, "none")).find(
    (n) => n.slug === slug,
  )!.summary;

afterAll(() => fs.rmSync(root, { recursive: true, force: true }));

describe("summary", () => {
  it("takes the first highlight over the first sentence, as plain text", () => {
    expect(summary("highlight")).toBe(
      "The cause was target holding a == b open.",
    );
  });

  it("falls back to the first sentence, markers and wikilinks gone", () => {
    expect(summary("sentence")).toBe(
      "A linked note with bold, code and emphasis.",
    );
  });

  it("keeps the whole paragraph when it has no sentence stop", () => {
    expect(summary("no-stop")).toBe("Post a screenshot and the bot replies:");
  });

  it("ends a sentence at a CJK full stop", () => {
    expect(summary("cjk")).toBe("第一句话说明结论。");
  });

  it("keeps masked runs for mosaic()", () => {
    expect(summary("masked")).toBe("On the ▒▒▒▒ stack every request hung.");
  });

  it("keeps `=` inside inline code", () => {
    expect(summary("code-eq")).toBe("Compare x === y inside code.");
  });

  it("cuts long text at a word boundary with an ellipsis", () => {
    const s = summary("long");
    expect(s.length).toBeLessThanOrEqual(180);
    expect(s).toMatch(/^(word )+word…$/);
  });

  it("is empty without a first paragraph", () => {
    expect(summary("empty")).toBe("");
  });
});
