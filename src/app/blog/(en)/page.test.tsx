import { beforeEach, describe, expect, it, vi } from "vitest";
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

beforeEach(() => history.replaceState(null, "", "/blog"));

const caseHrefs = (name = "Cases") => hrefs(screen.getByRole("region", { name }).querySelector("ol")!);

describe("BlogIndex", () => {
  it("shows named topic links with case counts above the newest-first list", () => {
    render(<BlogIndex />);
    const topics = screen.getByRole("navigation", { name: "Case topics" });
    const list = screen.getByRole("region", { name: "Cases" }).querySelector("ol")!;
    expect(topics.compareDocumentPosition(list) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(hrefs(topics)).toEqual(["/blog", "/blog?topic=map", "/blog?topic=second-map"]);
    expect(within(topics).getByRole("link", { name: "All 4", current: "page" })).toBeInTheDocument();
    expect(within(topics).getByRole("link", { name: "Title map 2" })).toBeInTheDocument();
    expect(within(topics).getByRole("link", { name: "Title second-map 1" })).toBeInTheDocument();
    expect(caseHrefs()).toEqual([
      "/blog/design-new", "/blog/debug-mid", "/blog/design-mid", "/blog/debug-old",
    ]);
  });

  it("shows a shared case in either topic and all cases for an unknown topic", () => {
    history.replaceState(null, "", "/blog?topic=map");
    const { rerender } = render(<BlogIndex />);
    const topics = screen.getByRole("navigation", { name: "Case topics" });
    expect(within(topics).getByRole("link", { name: "Title map 2", current: "page" })).toBeInTheDocument();
    expect(caseHrefs()).toEqual(["/blog/design-new", "/blog/debug-mid"]);
    expect(screen.getByRole("link", { name: "View topic Title map" })).toHaveAttribute("href", "/blog/map");
    expect(screen.getByText("1 technique · 1 lesson · 1 cheatsheet")).toBeVisible();

    history.replaceState(null, "", "/blog?topic=second-map");
    rerender(<BlogIndex />);
    expect(within(topics).getByRole("link", { name: "Title second-map 1", current: "page" })).toBeInTheDocument();
    expect(caseHrefs()).toEqual(["/blog/design-new"]);

    history.replaceState(null, "", "/blog?topic=unknown");
    rerender(<BlogIndex />);
    expect(within(topics).getByRole("link", { name: "All 4", current: "page" })).toBeInTheDocument();
    expect(caseHrefs()).toEqual([
      "/blog/design-new", "/blog/debug-mid", "/blog/design-mid", "/blog/debug-old",
    ]);
  });

  it("localizes the topic links and preserves the case order and redacted title", () => {
    history.replaceState(null, "", "/blog/zh?topic=map");
    render(<ChineseBlogIndex />);
    const topics = screen.getByRole("navigation", { name: "案例主题" });
    expect(hrefs(topics)).toEqual(["/blog/zh", "/blog/zh?topic=map", "/blog/zh?topic=second-map"]);
    expect(within(topics).getByRole("link", { name: "译文 map 2", current: "page" })).toBeInTheDocument();
    expect(caseHrefs("案例")).toEqual(["/blog/zh/design-new", "/blog/zh/debug-mid"]);
    expect(screen.getByRole("link", { name: "译文 已遮盖 term" })).toHaveAttribute("href", "/blog/zh/design-new");
    expect(screen.getByText("1 项技术 · 1 篇教训 · 1 份速查")).toBeVisible();
  });
});
