import { describe, it, expect } from "vitest";
import { siteJsonLd, SITE_URL } from "./seo";

describe("siteJsonLd", () => {
  const person = siteJsonLd["@graph"].find((n) => n["@type"] === "Person") as Record<string, unknown>;

  it("describes the Person", () => {
    expect(person.name).toBe("Kelson Qu");
    expect(person.url).toBe(SITE_URL);
    expect(person.jobTitle).toBe("Full-Stack & AI Engineer");
    expect(person.alumniOf).toMatchObject({ name: "Northeastern University" });
    expect(person.sameAs).toEqual([
      "https://github.com/KaichenQu",
      "https://www.linkedin.com/in/kelsonqu/",
    ]);
    expect((person.knowsAbout as string[]).length).toBeGreaterThan(0);
  });

  it("includes a WebSite node", () => {
    expect(siteJsonLd["@graph"].some((n) => n["@type"] === "WebSite")).toBe(true);
  });
});
