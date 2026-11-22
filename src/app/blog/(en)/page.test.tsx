import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import type { Note } from "@/lib/devlog";
import BlogIndex from "./page";
import ChineseBlogIndex from "../zh/page";

const note = (slug: string, section: Note["section"], date?: string): Note => ({
  slug,
  title: `Title ${slug}`,
  section,
  date,
  tags: [],
  description: "",
  summary: `Summary ${slug}`,
  readingMinutes: 1,
  links: [],
  body: "",
});

// Newest first, as getNotes returns them.
const NOTES = [
  note("design-new", "Design cases", "2026-11-04"),
  note("debug-mid", "Debug cases", "2026-10-01"),
  note("design-mid", "Design cases", "2026-10-01"),
  note("debug-old", "Debug cases", "2026-06-01"),
  note("map", "Maps"),
  note("second-map", "Maps"),
  note("pattern", "Techniques"),
  note("lesson", "Lessons"),
  note("shortcuts", "Cheatsheets"),
  note("term", "Glossary"),
];

// Locale-dependent title ordering swaps the same-day cases and the undated maps.
const ZH_NOTES = [
  "design-new", "design-mid", "debug-mid", "debug-old", "second-map", "map",
  "pattern", "lesson", "shortcuts", "term",
].map((slug) => NOTES.find((n) => n.slug === slug)!);

vi.mock("@/lib/devlog", async (importActual) => ({
  ...(await importActual<typeof import("@/lib/devlog")>()),
  getNotes: ({ locale }: { locale?: string } = {}) => locale === "zh-Hans" ? ZH_NOTES : NOTES,
}));

describe("BlogIndex", () => {
  it("lists every case once, newest first, in one grid before the maps", () => {
    render(<BlogIndex />);
    const headings = screen
      .getAllByRole("heading", { level: 2 })
      .map((h) => h.textContent);
    expect(headings).toEqual(["Cases", "Topic maps"]);
    const cases = within(
      screen.getByRole("region", { name: "Cases" }),
    ).getAllByRole("link");
    expect(cases.map((a) => a.getAttribute("href"))).toEqual([
      "/blog/design-new",
      "/blog/debug-mid",
      "/blog/design-mid",
      "/blog/debug-old",
    ]);
    for (const slug of ["design-new", "debug-mid", "design-mid", "debug-old"])
      expect(screen.getAllByRole("link", { name: new RegExp(slug) })).toHaveLength(1);
    expect(screen.queryByText("Title term")).toBeNull();
    const maps = within(screen.getByRole("region", { name: "Topic maps" })).getAllByRole("link");
    expect(maps.map((a) => a.getAttribute("href"))).toEqual([
      "/blog/map",
      "/blog/second-map",
    ]);
  });

  it("shows exactly the English index sections and note order in Chinese", () => {
    const english = render(<BlogIndex />);
    const enSections = screen.getAllByRole("region").map((region) =>
      within(region).getAllByRole("link").map((a) => a.getAttribute("href")),
    );
    english.unmount();

    render(<ChineseBlogIndex />);
    expect(screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent))
      .toEqual(["案例", "知识地图"]);
    const zhSections = screen.getAllByRole("region").map((region) =>
      within(region).getAllByRole("link").map((a) => a.getAttribute("href")),
    );
    expect(zhSections).toEqual(
      enSections.map((links) => links.map((href) => href?.replace(/^\/blog/, "/blog/zh"))),
    );
  });
});
