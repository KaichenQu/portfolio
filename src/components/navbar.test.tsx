import { describe, it, expect, vi } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import ActiveSectionContextProvider from "@/containers/active-section";
import { links } from "@/lib/data";
import Navbar from "./navbar";

vi.mock("next/navigation", () => ({ usePathname: () => "/about" }));

const renderNavbar = () =>
  render(
    <ActiveSectionContextProvider>
      <Navbar />
    </ActiveSectionContextProvider>,
  );

describe("Navbar", () => {
  it("gives the mobile menu Home, then the shared nav list in order", async () => {
    renderNavbar();

    await act(async () => void fireEvent.click(screen.getByRole("button")));

    const menu = screen.getByRole("navigation", { name: "Menu" });
    expect(
      within(menu)
        .getAllByRole("link")
        .map((a) => a.textContent),
    ).toEqual(["Home", ...links.map((l) => l.nameEng)]);
  });

  it("renders both the desktop header and the mobile menu trigger", () => {
    renderNavbar();

    expect(
      screen.getByRole("navigation", { name: "Main" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: "Menu" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Open menu" }),
    ).toBeInTheDocument();
    for (const link of links) {
      expect(
        screen.getAllByRole("link", { name: link.nameEng }).length,
      ).toBeGreaterThan(0);
    }
  });
});
