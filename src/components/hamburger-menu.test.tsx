import { describe, it, expect } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import ActiveSectionContextProvider from "@/containers/active-section";
import type { Link } from "@/lib/types";
import HamburgerMenu from "./hamburger-menu";

const links: Link[] = [
  { nameEng: "About", hash: "/#about" },
  { nameEng: "Projects", hash: "/#projects" },
];

const renderMenu = () =>
  render(
    <ActiveSectionContextProvider>
      <HamburgerMenu links={links} />
    </ActiveSectionContextProvider>,
  );

const trigger = () => screen.getByRole("button");

describe("HamburgerMenu", () => {
  it("starts closed", () => {
    renderMenu();

    expect(trigger()).toHaveAttribute("aria-expanded", "false");
    expect(trigger()).toHaveAccessibleName("Open menu");
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("opens on click and lists every link", async () => {
    renderMenu();

    await act(async () => void fireEvent.click(trigger()));

    expect(trigger()).toHaveAttribute("aria-expanded", "true");
    expect(trigger()).toHaveAccessibleName("Close menu");
    for (const link of links) {
      expect(screen.getByRole("link", { name: link.nameEng })).toHaveAttribute(
        "href",
        link.hash,
      );
    }
  });

  it("closes again when the trigger is clicked twice", async () => {
    renderMenu();

    await act(async () => void fireEvent.click(trigger()));
    await act(async () => void fireEvent.click(trigger()));

    expect(trigger()).toHaveAttribute("aria-expanded", "false");
  });

  it("closes when a link is chosen", async () => {
    renderMenu();

    await act(async () => void fireEvent.click(trigger()));
    await act(async () => void fireEvent.click(screen.getByRole("link", { name: "About" })));

    expect(trigger()).toHaveAttribute("aria-expanded", "false");
  });

  it("closes on a mousedown outside the menu", async () => {
    renderMenu();

    await act(async () => void fireEvent.click(trigger()));
    expect(trigger()).toHaveAttribute("aria-expanded", "true");

    await act(async () => void fireEvent.mouseDown(document.body));

    expect(trigger()).toHaveAttribute("aria-expanded", "false");
  });

  it("stays open on a mousedown inside the menu", async () => {
    renderMenu();

    await act(async () => void fireEvent.click(trigger()));
    await act(async () => void fireEvent.mouseDown(screen.getByRole("navigation")));

    expect(trigger()).toHaveAttribute("aria-expanded", "true");
  });
});
