import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import type { Note } from "@/lib/devlog";
import BlogIndex from "./page";

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
  note("map", "Maps"),
  note("debug-old", "Debug cases", "2026-06-01"),
  note("term", "Glossary"),
];

vi.mock("@/lib/devlog", () => ({ getNotes: () => NOTES }));

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
      "/blog/debug-old",
    ]);
    for (const slug of ["design-new", "debug-mid", "debug-old"])
      expect(screen.getAllByRole("link", { name: new RegExp(slug) })).toHaveLength(1);
    expect(screen.queryByText("Title term")).toBeNull();
    expect(
      within(screen.getByRole("region", { name: "Topic maps" })).getByRole(
        "link",
      ),
    ).toHaveAttribute("href", "/blog/map");
  });
});
