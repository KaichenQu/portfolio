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
  note("debug-old", "Debug cases", "2026-06-01"),
  { ...note("map", "Maps"), links: ["design-new", "debug-mid"] },
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
  title: slug === "term" ? "译文 ▒▒ term" : `译文 ${slug}`,
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
  it("puts a linked map of every note above the newest-first case graph", () => {
    render(<BlogIndex />);
    const map = screen.getByRole("region", { name: "Topic maps" });
    const cases = screen.getByRole("region", { name: "Cases" });
    expect(map.compareDocumentPosition(cases) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(hrefs(map)).toEqual(NOTES.map(note => `/blog/${note.slug}`));
    expect(hrefs(cases)).toEqual([
      "/blog/design-new", "/blog/debug-mid", "/blog/design-mid", "/blog/debug-old",
    ]);
    expect(within(map).getByText(/10 notes/)).toHaveTextContent("4 links");
    expect(within(cases).getByText("wip")).toBeInTheDocument();
    expect(map.querySelectorAll("a[tabindex='0']")).toHaveLength(1);
    expect(hrefs(screen.getByRole("navigation", { name: "Topic maps" })))
      .toEqual(["/blog/map", "/blog/second-map"]);
  });

  it("localizes the variant while keeping English order and raw status tokens", () => {
    render(<ChineseBlogIndex />);
    const map = screen.getByRole("region", { name: "知识地图" });
    const cases = screen.getByRole("region", { name: "案例" });
    expect(hrefs(map)).toEqual(NOTES.map(note => `/blog/zh/${note.slug}`));
    expect(hrefs(cases)).toEqual([
      "/blog/zh/design-new", "/blog/zh/debug-mid", "/blog/zh/design-mid", "/blog/zh/debug-old",
    ]);
    const station = within(map).getByRole("link", { name: "译文 已遮盖 term" });
    fireEvent.focusIn(station);
    expect(map.querySelector("[data-map-tooltip] .redacted")).toHaveAttribute("aria-label", "已遮盖");
    expect(map.querySelector(".index-map-status")).not.toHaveAttribute("aria-live");
    expect(within(cases).getByText("wip")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "状态" })).toBeEnabled();
  });

  it("applies one URL-backed filter to both map stations and case rows", () => {
    const { container, rerender } = render(<BlogIndex />);
    const map = screen.getByRole("region", { name: "Topic maps" });
    const cases = screen.getByRole("region", { name: "Cases" });
    const mapType = container.querySelector<HTMLSelectElement>('select[data-index-filter="type"]:not([data-case-filter])')!;
    const caseType = container.querySelector<HTMLSelectElement>("[data-case-filter]")!;
    try {
      expect(Array.from(caseType.options, option => option.value)).toEqual(["", "case-debug", "case-design"]);
      expect(mapType.querySelector('option[value="glossary"]')).toBeInTheDocument();
      fireEvent.change(mapType, { target: { value: "case-debug" } });
      fireEvent.change(screen.getByRole("combobox", { name: "Status" }), { target: { value: "solved" } });
      expect(hrefs(map)).toEqual(["/blog/debug-mid"]);
      expect(hrefs(cases)).toEqual(["/blog/debug-mid"]);
      expect(location.search).toBe("?type=case-debug&status=solved");

      rerender(<BlogIndex />);
      history.replaceState(null, "", location.pathname);
      rerender(<BlogIndex />);
      expect(mapType.value).toBe("");
      expect(hrefs(map)).toHaveLength(NOTES.length);
      expect(hrefs(cases)).toHaveLength(4);
    } finally {
      history.replaceState(null, "", location.pathname);
    }
  });

  it("reuses the first palette colour for a sixth topic and leaves detached marks neutral", () => {
    const extraTopics = [3, 4, 5, 6].map(number => ({
      ...note(`topic-${number}`, "Maps"),
      links: number === 6 ? ["design-new"] : [],
    }));
    NOTES.push(...extraTopics);
    try {
      render(<BlogIndex />);
      const map = screen.getByRole("region", { name: "Topic maps" });
      expect(map.querySelectorAll(".index-map-rail")[5]).toHaveAttribute("data-rail-color", "0");
      expect(within(map).getByRole("link", { name: "Title topic-6" })).toHaveAttribute("data-rail-color", "0");
      expect(within(map).getByRole("link", { name: "Title design-new" }).style.getPropertyValue("--map-ring"))
        .toContain("var(--rail-0)");
      expect(within(map).getByRole("link", { name: "Title design-new" }).style.getPropertyValue("--map-ring"))
        .not.toContain("var(--rail-5)");
      expect(within(map).getByRole("link", { name: "Title lesson" })).not.toHaveAttribute("data-rail-color");
    } finally {
      NOTES.splice(-extraTopics.length, extraTopics.length);
    }
  });
});
