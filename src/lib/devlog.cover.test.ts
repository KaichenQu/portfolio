// @vitest-environment node
import { afterAll, describe, expect, it } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { getNotes } from "./devlog";

const root = fs.mkdtempSync(path.join(os.tmpdir(), "devlog-cover-"));
const DIR = path.join(root, "devlog");
const DIAGRAMS = path.join(root, "diagrams");
const write = (file: string, text: string) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
};
const svg = (name: string, attrs: string) =>
  write(
    path.join(DIAGRAMS, name),
    `<?xml version="1.0"?>\n<svg xmlns="http://www.w3.org/2000/svg" ${attrs}><rect stroke-width="3"/></svg>`,
  );
const note = (name: string, body: string) =>
  write(path.join(DIR, "Glossary", `${name}.md`), `# ${name}\n\n${body}\n`);

svg("first.svg", 'width="617px" height="442px" viewBox="0 0 10 10"');
svg("second.svg", 'width="100" height="50"');
svg("box.svg", 'viewBox="0 0 320.4 180"');
svg("percent.svg", 'width="100%" height="100%" viewBox="0, 0, 800, 450"');
note(
  "several",
  "![png](../Diagrams/x.png)\n\n![first](../../Diagrams/first.svg)\n\n![second](../Diagrams/second.svg)",
);
note("missing", "![gone](../Diagrams/not-synced.svg)");
note(
  "skips-missing",
  "![gone](../Diagrams/not-synced.svg)\n\n![box](../Diagrams/box.svg)",
);
note("percent", "![pct](../Diagrams/percent.svg)");
note("plain", "No picture.\n\n```mermaid\nflowchart LR\n  A --> B\n```");

const cover = (slug: string) =>
  getNotes(DIR, DIAGRAMS).find((n) => n.slug === slug)!.cover;

afterAll(() => fs.rmSync(root, { recursive: true, force: true }));

describe("cover", () => {
  it("takes the first diagram image, at its public URL and root size", () => {
    expect(cover("several")).toEqual({
      src: "/blog/diagrams/first.svg",
      alt: "first",
      width: 617,
      height: 442,
    });
  });

  it("skips an image whose file is missing", () => {
    expect(cover("missing")).toBeUndefined();
    expect(cover("skips-missing")?.src).toBe("/blog/diagrams/box.svg");
  });

  it("falls back to the viewBox when the root has no pixel size", () => {
    expect(cover("skips-missing")).toMatchObject({ width: 320, height: 180 });
    expect(cover("percent")).toMatchObject({ width: 800, height: 450 });
  });

  it("is absent without an image, Mermaid included", () => {
    expect(cover("plain")).toBeUndefined();
  });
});
