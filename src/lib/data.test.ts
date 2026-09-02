import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { links, projectsData } from "./data";

describe("links", () => {
  it("has unique names and hashes", () => {
    expect(new Set(links.map((l) => l.nameEng)).size).toBe(links.length);
    expect(new Set(links.map((l) => l.hash)).size).toBe(links.length);
  });

  it("uses '/', '/#section' or an absolute URL for every hash", () => {
    for (const link of links) {
      expect(link.nameEng.trim().length).toBeGreaterThan(0);
      expect(link.hash).toMatch(/^(\/|\/#[a-z-]+|https?:\/\/\S+)$/);
    }
  });

  it("has at least one in-page '/#section' link", () => {
    expect(links.some((l) => /^\/#[a-z-]+$/.test(l.hash))).toBe(true);
  });
});

describe("projectsData", () => {
  it("is non-empty", () => {
    expect(projectsData.length).toBeGreaterThan(0);
  });

  it("gives every project a title, description, tags and imageUrl", () => {
    for (const project of projectsData) {
      expect(project.title.trim().length).toBeGreaterThan(0);
      expect(project.description.trim().length).toBeGreaterThan(0);
      expect(Array.isArray(project.tags)).toBe(true);
      expect(project.tags.length).toBeGreaterThan(0);
      expect(project.imageUrl.startsWith("/")).toBe(true);
      expect((project.imageUrlDark ?? "/").startsWith("/")).toBe(true);
    }
  });

  it("has unique titles", () => {
    expect(new Set(projectsData.map((p) => p.title)).size).toBe(
      projectsData.length,
    );
  });

  it("points every imageUrl and imageUrlDark at a file under public/", () => {
    for (const project of projectsData) {
      for (const url of [
        project.imageUrl,
        project.imageUrlDark ?? project.imageUrl,
      ]) {
        const file = path.join(process.cwd(), "public", url);
        expect(fs.existsSync(file), `${url} missing under public/`).toBe(true);
      }
    }
  });
});
