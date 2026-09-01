import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { LastUpdate } from "./last-update";

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("LastUpdate", () => {
  it("requests /api/last-update and renders the returned date", async () => {
    const lastUpdate = "2025-03-04T12:00:00Z";
    vi.mocked(fetch).mockResolvedValue({
      json: async () => ({ lastUpdate }),
    } as Response);

    render(<LastUpdate />);

    expect(fetch).toHaveBeenCalledWith("/api/last-update");
    const expected = new Date(lastUpdate).toLocaleDateString("zh-CN");
    await waitFor(() =>
      expect(screen.getByText(/Last updated:/)).toHaveTextContent(expected),
    );
  });

  it("falls back to the current date when the request fails", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("offline"));

    render(<LastUpdate />);

    const today = new Date().toLocaleDateString("zh-CN");
    await waitFor(() =>
      expect(screen.getByText(/Last updated:/)).toHaveTextContent(today),
    );
  });

  it("renders nothing before the request resolves", () => {
    vi.mocked(fetch).mockReturnValue(new Promise(() => {}) as Promise<Response>);

    const { container } = render(<LastUpdate />);

    expect(container).toBeEmptyDOMElement();
  });
});
