import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "fs";
import path from "path";

vi.mock("fs", () => ({
  default: { existsSync: vi.fn(), readdirSync: vi.fn() },
}));

import { GET } from "./route";

const existsSync = vi.mocked(fs.existsSync);
const readdirSync = vi.mocked(fs.readdirSync);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/resume", () => {
  it("returns the first PDF found in public/resume", async () => {
    existsSync.mockReturnValue(true);
    readdirSync.mockReturnValue(["notes.txt", "KaichenQu-Resume.pdf"] as never);

    const res = await GET();

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ filename: "KaichenQu-Resume.pdf" });
    expect(existsSync).toHaveBeenCalledWith(
      path.join(process.cwd(), "public", "resume"),
    );
  });

  it("404s when the resume directory is missing", async () => {
    existsSync.mockReturnValue(false);

    const res = await GET();

    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ error: "Resume directory not found" });
  });

  it("404s when the directory holds no PDF", async () => {
    existsSync.mockReturnValue(true);
    readdirSync.mockReturnValue(["README.md"] as never);

    const res = await GET();

    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ error: "No resume found" });
  });

  it("500s when reading the directory throws", async () => {
    existsSync.mockReturnValue(true);
    readdirSync.mockImplementation(() => {
      throw new Error("EIO");
    });
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await GET();

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "Failed to read resume" });
    consoleError.mockRestore();
  });
});
