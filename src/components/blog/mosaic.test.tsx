import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { mosaic } from "./mosaic";

describe("mosaic", () => {
  it("wraps each redacted run in a title and keeps the rest as text", () => {
    const run = "▒".repeat(4);
    const { container } = render(<p>{mosaic(`${run} cache ${run}${run} key`)}</p>);

    expect(screen.getAllByRole("img", { name: "redacted" })).toHaveLength(2);
    expect(container.querySelector("p")!.innerHTML).toBe(
      `<span class="redacted" role="img" aria-label="redacted">${run}</span> cache ` +
        `<span class="redacted" role="img" aria-label="redacted">${run}${run}</span> key`,
    );
  });

  it("returns a title without runs unchanged", () => {
    expect(mosaic("Retry with backoff")).toBe("Retry with backoff");
  });
});
