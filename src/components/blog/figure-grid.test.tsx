import { afterAll, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import fs from "fs";
import os from "os";
import path from "path";
import { getNotes } from "@/lib/devlog";
import { FigureGrid } from "./figure-grid";

const root = fs.mkdtempSync(path.join(os.tmpdir(), "devlog-figures-"));
const DIR = path.join(root, "devlog");
const DIAGRAMS = path.join(root, "diagrams");
const write = (file: string, text: string) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
};
const note = (rel: string, title: string, date?: string, image = true) =>
  write(
    path.join(DIR, rel),
    (date ? `---\ndate: ${date}\nstatus: solved\n---\n` : "") +
      `# ${title}\n\nBody.\n\n` +
      (image ? `![${title} diagram](../../Diagrams/d.svg)\n` : ""),
  );

write(
  path.join(DIAGRAMS, "d.svg"),
  '<svg xmlns="http://www.w3.org/2000/svg" width="617px" height="442px"></svg>',
);
note("Cases/Debug/2026-03-01-older.md", "Older", "2026-03-01");
note("Cases/Design/2026-04-01-newer.md", "Newer", "2026-04-01");
note("Glossary/zeta.md", "Zeta");
note("Glossary/alpha.md", "Alpha");
note("Glossary/plain.md", "Plain", undefined, false);

afterAll(() => fs.rmSync(root, { recursive: true, force: true }));

describe("FigureGrid", () => {
  it("renders one linked card per note with a cover, newest first, undated by title", () => {
    render(<FigureGrid notes={getNotes(DIR, DIAGRAMS)} />);
    const cards = screen.getAllByRole("link");
    expect(cards.map((a) => a.getAttribute("href"))).toEqual([
      "/blog/2026-04-01-newer",
      "/blog/2026-03-01-older",
      "/blog/alpha",
      "/blog/zeta",
    ]);
    expect(cards[0]).toHaveTextContent("Newer");
    expect(cards[0]).toHaveTextContent("2026-04-01");
    for (const card of cards) {
      const img = card.querySelector("img")!;
      expect(img).toHaveAttribute("src", "/blog/diagrams/d.svg");
      expect(img).toHaveAttribute("width", "617");
      expect(img).toHaveAttribute("height", "442");
      expect(img).toHaveAttribute("loading", "lazy");
      expect(img).toHaveAttribute("decoding", "async");
    }
  });

  it("sizes every cover box by its aspect ratio alone, with the image out of flow", () => {
    render(<FigureGrid notes={getNotes(DIR, DIAGRAMS)} />);
    for (const img of screen.getAllByRole("img")) {
      expect(img).toHaveClass("absolute", "inset-0");
      expect(img.parentElement).toHaveClass("relative", "aspect-[16/10]");
    }
  });
});
