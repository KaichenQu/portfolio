import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ActiveSectionContextProvider from "@/containers/active-section";
import { links } from "@/lib/data";
import Navbar from "./navbar";

vi.mock("next/navigation", () => ({ usePathname: () => "/about" }));

describe("Navbar", () => {
  it("renders both the desktop header and the mobile menu trigger", () => {
    render(
      <ActiveSectionContextProvider>
        <Navbar />
      </ActiveSectionContextProvider>,
    );

    expect(screen.getByRole("navigation", { name: "Main" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Menu" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open menu" })).toBeInTheDocument();
    for (const link of links) {
      expect(screen.getAllByRole("link", { name: link.nameEng }).length).toBeGreaterThan(0);
    }
  });
});
