import { describe, it, expect, afterEach, vi } from "vitest";
import { GET } from "./route";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe("GET /api/last-update", () => {
  it("returns BUILD_TIME when it is set", async () => {
    vi.stubEnv("BUILD_TIME", "2025-03-04T00:00:00.000Z");

    const res = await GET();

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      lastUpdate: "2025-03-04T00:00:00.000Z",
    });
  });

  it("falls back to the current time when BUILD_TIME is unset", async () => {
    vi.stubEnv("BUILD_TIME", undefined);
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-02T03:04:05.000Z"));

    const res = await GET();

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      lastUpdate: "2025-01-02T03:04:05.000Z",
    });
  });
});
