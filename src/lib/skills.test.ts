import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { skillCategories, skillIcons } from "./skills";

describe("skillCategories", () => {
  it("is non-empty and has unique labels", () => {
    expect(skillCategories.length).toBeGreaterThan(0);
    expect(new Set(skillCategories.map((c) => c.label)).size).toBe(skillCategories.length);
  });

  it("gives every category non-empty skills with unique names and 0-100 progress", () => {
    for (const category of skillCategories) {
      expect(category.skills.length).toBeGreaterThan(0);
      const names = category.skills.map((s) => s.name);
      expect(new Set(names).size).toBe(names.length);
      for (const skill of category.skills) {
        expect(skill.name.trim().length).toBeGreaterThan(0);
        expect(skill.description.trim().length).toBeGreaterThan(0);
        expect(skill.progress).toBeGreaterThan(0);
        expect(skill.progress).toBeLessThanOrEqual(100);
      }
    }
  });

  it("has globally unique skill names", () => {
    const all = skillCategories.flatMap((c) => c.skills.map((s) => s.name));
    expect(new Set(all).size).toBe(all.length);
  });
});

describe("skillIcons", () => {
  it("is non-empty with unique alt text and unique srcs", () => {
    expect(skillIcons.length).toBeGreaterThan(0);
    expect(new Set(skillIcons.map((i) => i.alt)).size).toBe(skillIcons.length);
    expect(new Set(skillIcons.map((i) => i.src)).size).toBe(skillIcons.length);
  });

  it("points every src at a file that exists under public/", () => {
    for (const icon of skillIcons) {
      expect(icon.src.startsWith("/")).toBe(true);
      const file = path.join(process.cwd(), "public", icon.src);
      expect(fs.existsSync(file), `${icon.src} missing under public/`).toBe(true);
    }
  });
});
