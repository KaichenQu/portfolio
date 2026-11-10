import { describe, it, expect } from "vitest";
import { pageMetadata, siteJsonLd, SITE_URL } from "./seo";

describe("siteJsonLd", () => {
  const person = siteJsonLd["@graph"].find(
    (n) => n["@type"] === "Person",
  ) as Record<string, unknown>;

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
    expect(siteJsonLd["@graph"].some((n) => n["@type"] === "WebSite")).toBe(
      true,
    );
  });
});

describe("pageMetadata", () => {
  it("points canonical, Open Graph and Twitter at the route itself", () => {
    const m = pageMetadata("/about", "About", "Who I am.");
    expect(m.title).toBe("About");
    expect(m.alternates).toEqual({ canonical: "/about" });
    expect(m.openGraph).toMatchObject({
      url: "/about",
      title: "About | Kelson Qu",
      description: "Who I am.",
      siteName: "Kelson Qu Portfolio",
      type: "website",
    });
    expect(m.twitter).toMatchObject({
      title: "About | Kelson Qu",
      description: "Who I am.",
    });
  });

  it("lets a route override the Open Graph type", () => {
    const m = pageMetadata("/blog/x", "X", "d", {
      type: "article",
      tags: ["a"],
    });
    expect(m.openGraph).toMatchObject({
      type: "article",
      tags: ["a"],
      url: "/blog/x",
    });
  });
});
