import { describe, it, expect, vi } from "vitest";
import sitemap from "./sitemap";

vi.mock("@/lib/devlog", () => ({
  getNotes: () => [
    { slug: "dated-note", date: "2026-03-04" },
    { slug: "undated-note" },
  ],
  getTags: () => [{ tag: "cache", count: 2 }],
}));

describe("sitemap", () => {
  const entries = sitemap();
  const byUrl = (path: string) =>
    entries.find((e) => e.url === `https://www.kelsonqu.com${path}`);

  it("lists the site routes, the blog, every note and every tag", () => {
    expect(entries.map((e) => e.url)).toEqual([
      "https://www.kelsonqu.com",
      "https://www.kelsonqu.com/about",
      "https://www.kelsonqu.com/showcase",
      "https://www.kelsonqu.com/contact",
      "https://www.kelsonqu.com/blog",
      "https://www.kelsonqu.com/blog/dated-note",
      "https://www.kelsonqu.com/blog/undated-note",
      "https://www.kelsonqu.com/blog/tags/cache",
    ]);
  });

  it("sets lastModified only from a note date", () => {
    expect(byUrl("/blog/dated-note")?.lastModified).toBe("2026-03-04");
    expect(
      entries.filter((e) => "lastModified" in e).map((e) => e.url),
    ).toEqual(["https://www.kelsonqu.com/blog/dated-note"]);
  });
});
