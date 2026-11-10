import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import Explorer, { type ExplorerGroup } from "./explorer";

const usePathname = vi.fn();
vi.mock("next/navigation", () => ({ usePathname: () => usePathname() }));

const groups: ExplorerGroup[] = [
  {
    section: "Debug cases",
    notes: [
      {
        slug: "cache-goes-stale",
        title: "Cache goes stale",
        tags: ["debug", "cache"],
      },
      {
        slug: "port-conflict",
        title: "Port conflict on boot",
        tags: ["debug", "network"],
      },
    ],
  },
  {
    section: "Glossary",
    notes: [{ slug: "etag", title: "ETag", tags: ["glossary", "cache"] }],
  },
];

const sectionButton = (name: string) =>
  screen.getByRole("button", { name: new RegExp(name) });

beforeEach(() => {
  usePathname.mockReturnValue("/blog/port-conflict");
});

describe("Explorer", () => {
  it("shows a count per section and opens only the current note's section", () => {
    render(<Explorer groups={groups} />);

    expect(sectionButton("Debug cases")).toHaveTextContent("2");
    expect(sectionButton("Debug cases")).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(sectionButton("Glossary")).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.getByRole("link", { name: "Port conflict on boot" }),
    ).toHaveAttribute("aria-current", "page");
    expect(
      screen.queryByRole("link", { name: "ETag" }),
    ).not.toBeInTheDocument();
  });

  it("collapses and expands a section", () => {
    render(<Explorer groups={groups} />);

    fireEvent.click(sectionButton("Glossary"));
    expect(screen.getByRole("link", { name: "ETag" })).toBeInTheDocument();
    fireEvent.click(sectionButton("Debug cases"));
    expect(
      screen.queryByRole("link", { name: "Cache goes stale" }),
    ).not.toBeInTheDocument();
  });

  it("filters by title and by tag across sections", () => {
    render(<Explorer groups={groups} />);
    const input = screen.getByRole("searchbox", { name: /filter notes/i });

    fireEvent.change(input, { target: { value: "cache" } });
    const nav = screen.getByRole("navigation");
    expect(
      within(nav)
        .getAllByRole("link")
        .map((a) => a.textContent),
    ).toEqual(["Cache goes stale", "ETag"]);
    expect(sectionButton("Debug cases")).toHaveTextContent("1");

    fireEvent.change(input, { target: { value: "PORT" } });
    expect(
      within(nav)
        .getAllByRole("link")
        .map((a) => a.textContent),
    ).toEqual(["Port conflict on boot"]);

    fireEvent.change(input, { target: { value: "nothing-matches" } });
    expect(screen.getByText("No matching notes.")).toBeInTheDocument();
  });
});
