import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import ActiveSectionContextProvider from "@/containers/active-section";
import SidebarNav from "./sidebar-nav";

const usePathname = vi.fn();
vi.mock("next/navigation", () => ({ usePathname: () => usePathname() }));

const ITEMS = [
  ["About", "/#about"],
  ["Projects", "/#projects"],
  ["Experience", "/#experience"],
  ["Skills", "/#skills"],
  ["Contact", "/#contact"],
  ["Blog", "/blog"],
];

const renderNav = (active: string) =>
  render(
    <ActiveSectionContextProvider>
      <SidebarNav active={active} />
    </ActiveSectionContextProvider>,
  );

beforeEach(() => {
  usePathname.mockReturnValue("/blog/some-note");
});

describe("SidebarNav", () => {
  it("renders the six items in order, pointing back at the home sections", () => {
    renderNav("/blog");

    const items = screen.getAllByRole("link");
    expect(items.map((a) => [a.textContent, a.getAttribute("href")])).toEqual(
      ITEMS,
    );
  });

  it("marks only the item it is told is active", () => {
    renderNav("/blog");

    for (const [label] of ITEMS) {
      const link = screen.getByRole("link", { name: label });
      if (label === "Blog") expect(link).toHaveAttribute("aria-current", "true");
      else expect(link).not.toHaveAttribute("aria-current");
    }
  });

  it("uses in-page anchors on the home page", () => {
    usePathname.mockReturnValue("/");
    renderNav("/#skills");

    const items = screen.getAllByRole("link");
    expect(items.map((a) => a.getAttribute("href"))).toEqual([
      "#about",
      "#projects",
      "#experience",
      "#skills",
      "#contact",
      "/blog",
    ]);
    expect(screen.getByRole("link", { name: "Skills" })).toHaveAttribute(
      "aria-current",
      "true",
    );
  });
});
