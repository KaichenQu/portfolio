import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import type { Note } from "@/lib/devlog";
import BlogLayout from "./layout";

const getNotes = vi.fn<() => Partial<Note>[]>();
vi.mock("@/lib/devlog", async (importActual) => ({
  ...(await importActual<typeof import("@/lib/devlog")>()),
  getNotes: () => getNotes(),
}));
vi.mock("next/navigation", () => ({ usePathname: () => "/blog" }));

const renderLayout = () =>
  render(<BlogLayout>content</BlogLayout>).container.firstElementChild!;

describe("BlogLayout", () => {
  it("drops the explorer column when there are no notes", () => {
    getNotes.mockReturnValue([]);

    const root = renderLayout();
    expect(root).not.toHaveClass("lg:grid");
    expect(root.querySelector("aside")).toBeNull();
  });

  it("keeps the explorer column beside the content otherwise", () => {
    getNotes.mockReturnValue([
      { slug: "a", title: "A", tags: [], section: "Glossary" },
    ]);

    const root = renderLayout();
    expect(root).toHaveClass("lg:grid");
    expect(root.querySelector("aside")).not.toBeNull();
  });
});
