import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
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

const NOTES = [
  { ...note("design-new", "Design cases", "2026-11-04"), type: "case-design", status: "wip" },
  { ...note("debug-mid", "Debug cases", "2026-10-01"), type: "case-debug", status: "solved" },
  note("design-mid", "Design cases", "2026-10-01"),
  { ...note("debug-old", "Debug cases", "2026-06-01"), status: "open" },
  { ...note("map", "Maps"), links: ["design-new", "debug-mid", "shortcuts", "lesson", "pattern"] },
  { ...note("second-map", "Maps"), links: ["design-new", "term"] },
  note("pattern", "Techniques"),
  note("lesson", "Lessons"),
  note("shortcuts", "Cheatsheets"),
  { ...note("term", "Glossary"), title: "Title ▒▒ term", type: "glossary" },
];

// The translation sorts same-day cases and undated topics differently.
const ZH_NOTES = [
  "design-new", "design-mid", "debug-mid", "debug-old", "second-map", "map",
  "pattern", "lesson", "shortcuts", "term",
].map((slug) => ({
  ...NOTES.find(n => n.slug === slug)!,
  title: slug === "design-new" ? "译文 ▒▒ term" : `译文 ${slug}`,
}));

vi.mock("@/lib/devlog", async (importActual) => ({
  ...(await importActual<typeof import("@/lib/devlog")>()),
  getNotes: ({ locale }: { locale?: string } = {}) => locale === "zh-Hans" ? ZH_NOTES : NOTES,
}));
vi.mock("next/navigation", async (importActual) => ({
  ...(await importActual<typeof import("next/navigation")>()),
  useSearchParams: () => new URLSearchParams(location.search),
}));

const hrefs = (element: HTMLElement) =>
  within(element).getAllByRole("link").map(a => a.getAttribute("href"));

describe("BlogIndex", () => {
  it("puts named topic rails and their case links above the newest-first case graph", () => {
    render(<BlogIndex />);
    const map = screen.getByRole("region", { name: "Topic maps" });
    const cases = screen.getByRole("region", { name: "Cases" });
    expect(map.compareDocumentPosition(cases) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(hrefs(map)).toEqual([
      "/blog/map", "/blog/debug-mid", "/blog/design-new", "/blog/second-map", "/blog/design-new",
    ]);
    expect(hrefs(cases)).toEqual([
      "/blog/design-new", "/blog/debug-mid", "/blog/design-mid", "/blog/debug-old",
    ]);
    expect(within(map).getByRole("link", { name: "Title map" }))
      .toHaveAccessibleDescription("2 cases · 2 techniques · 1 lesson");
    expect(within(map).getByRole("link", { name: "Title second-map" }))
      .toHaveAccessibleDescription("1 case · 1 term");
    expect(map.querySelectorAll("a[tabindex='0']")).toHaveLength(1);
    expect(hrefs(screen.getByRole("navigation", { name: "Topic maps" })))
      .toEqual(["/blog/map", "/blog/second-map"]);
  });

  it("localizes the rails and preserves a focused case across its topic memberships", () => {
    render(<ChineseBlogIndex />);
    const map = screen.getByRole("region", { name: "知识地图" });
    const cases = screen.getByRole("region", { name: "案例" });
    expect(hrefs(map)).toEqual([
      "/blog/zh/map", "/blog/zh/debug-mid", "/blog/zh/design-new", "/blog/zh/second-map", "/blog/zh/design-new",
    ]);
    expect(hrefs(cases)).toEqual([
      "/blog/zh/design-new", "/blog/zh/debug-mid", "/blog/zh/design-mid", "/blog/zh/debug-old",
    ]);
    const [station, duplicate] = within(map).getAllByRole("link", { name: "译文 已遮盖 term" });
    fireEvent.focusIn(station);
    expect(station.parentElement).toHaveAttribute("data-current");
    expect(duplicate.parentElement).toHaveAttribute("data-duplicate");
    expect(map.querySelector("[data-map-tooltip] .redacted")).toHaveAttribute("aria-label", "已遮盖");
    expect(map.querySelector("[data-map-tooltip]")).toHaveTextContent("2026-11-04wip");
    expect(within(cases).getByRole("group", { name: "案例状态" })).toBeInTheDocument();
  });

  it("applies URL-backed type and status toggles to map cases and list rows together", () => {
    render(<BlogIndex />);
    const map = screen.getByRole("region", { name: "Topic maps" });
    const cases = screen.getByRole("region", { name: "Cases" });
    const toggle = (name: string) => within(cases).getByRole("button", { name });
    try {
      fireEvent.click(toggle("debug"));
      fireEvent.click(toggle("solved"));
      expect(toggle("debug")).toHaveAttribute("aria-pressed", "true");
      expect(hrefs(map)).toEqual(["/blog/map", "/blog/debug-mid", "/blog/second-map"]);
      expect(hrefs(cases)).toEqual(["/blog/debug-mid"]);
      expect(location.search).toBe("?type=case-debug&status=solved");

      fireEvent.click(toggle("open"));
      expect(location.search).toBe("?type=case-debug&status=solved&status=open");
      expect(hrefs(cases)).toEqual(["/blog/debug-mid", "/blog/debug-old"]);

      history.replaceState(null, "", location.pathname);
      fireEvent.popState(window);
      expect(toggle("debug")).toHaveAttribute("aria-pressed", "false");
      expect(hrefs(map)).toHaveLength(5);
      expect(hrefs(cases)).toHaveLength(4);
    } finally {
      history.replaceState(null, "", location.pathname);
    }
  });
});
