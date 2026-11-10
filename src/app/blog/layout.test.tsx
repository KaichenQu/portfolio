import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ActiveSectionContextProvider from "@/containers/active-section";
import type { Note } from "@/lib/devlog";
import BlogLayout from "./layout";

const getNotes = vi.fn<() => Partial<Note>[]>();
vi.mock("@/lib/devlog", async (importActual) => ({
  ...(await importActual<typeof import("@/lib/devlog")>()),
  getNotes: () => getNotes(),
}));
vi.mock("next/navigation", () => ({ usePathname: () => "/blog" }));

const renderLayout = () =>
  render(
    <ActiveSectionContextProvider>
      <BlogLayout>content</BlogLayout>
    </ActiveSectionContextProvider>,
  ).container.firstElementChild!;

describe("BlogLayout", () => {
  it("shows the identity linking home and the site nav with Blog active", () => {
    getNotes.mockReturnValue([]);
    renderLayout();

    expect(
      screen.getByRole("link", { name: /Kelson Qu/ }),
    ).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Blog" })).toHaveAttribute(
      "aria-current",
      "true",
    );
  });

  it("drops the explorer when there are no notes", () => {
    getNotes.mockReturnValue([]);

    const root = renderLayout();
    expect(
      screen.queryByRole("navigation", { name: "DevLog notes" }),
    ).not.toBeInTheDocument();
    expect(root.querySelector("hr")).toBeNull();
  });

  it("puts the explorer under the nav otherwise", () => {
    getNotes.mockReturnValue([
      { slug: "a", title: "A", tags: [], section: "Glossary" },
    ]);

    renderLayout();
    expect(
      screen.getByRole("navigation", { name: "DevLog notes" }),
    ).toBeInTheDocument();
  });
});
