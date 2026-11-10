import { describe, it, expect } from "vitest";
import sitemap from "./sitemap";

describe("sitemap", () => {
  const entries = sitemap();

  it("lists the four routes", () => {
    expect(entries.map((e) => e.url)).toEqual([
      "https://www.kelsonqu.com",
      "https://www.kelsonqu.com/about",
      "https://www.kelsonqu.com/showcase",
      "https://www.kelsonqu.com/contact",
    ]);
  });

  it("omits lastModified", () => {
    expect(entries.every((e) => !("lastModified" in e))).toBe(true);
  });
});
