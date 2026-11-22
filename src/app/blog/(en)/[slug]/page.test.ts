import { describe, it, expect, vi } from "vitest";
import { generateMetadata } from "./page";

vi.mock("@/lib/devlog", () => ({
  getNote: (slug: string) => ({
    slug,
    title: "A note",
    description: "About it.",
    tags: [],
  }),
}));

describe("note metadata", () => {
  it("points Open Graph and Twitter at the note's own card", async () => {
    const meta = await generateMetadata({
      params: Promise.resolve({ slug: "a-note" }),
    });
    const card = {
      url: "/blog/a-note/opengraph-image",
      width: 1200,
      height: 630,
      alt: "A note",
    };
    expect(meta.openGraph?.images).toEqual([card]);
    expect(meta.twitter?.images).toEqual([card]);
  });
});
