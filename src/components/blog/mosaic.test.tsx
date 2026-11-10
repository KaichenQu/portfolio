import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { mosaic, wrapRedactedRuns } from "./mosaic";

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

describe("wrapRedactedRuns", () => {
  it("wraps runs in foreignObject HTML labels and leaves SVG text as glyphs", () => {
    const run = "\u2592".repeat(4);
    const el = document.createElement("div");
    el.innerHTML =
      `<svg><text>${run}<tspan>${run}</tspan></text>` +
      `<foreignObject><div><span class="nodeLabel"><p>key ${run} here</p></span></div></foreignObject></svg>`;

    wrapRedactedRuns(el);

    expect(el.querySelector("p")!.innerHTML).toBe(
      `key <span class="redacted" role="img" aria-label="redacted">${run}</span> here`,
    );
    expect(el.querySelector("text")!.innerHTML).toBe(`${run}<tspan>${run}</tspan>`);
    expect(el.querySelectorAll(".redacted")).toHaveLength(1);
  });
});
