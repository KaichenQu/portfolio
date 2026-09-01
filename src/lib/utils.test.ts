import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("merges multiple class arguments", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("lets a later tailwind utility win over a conflicting earlier one", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("ignores falsy values and resolves conditional objects/arrays", () => {
    expect(cn("a", false, null, undefined, "", ["b", { c: true, d: false }])).toBe("a b c");
  });
});
