import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import ThemeContextProvider from "@/containers/theme-context";
import ThemeSwitch from "./theme-controller";

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove("dark");
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  );
});

describe("ThemeSwitch", () => {
  it("throws without a ThemeContextProvider", () => {
    expect(() => render(<ThemeSwitch />)).toThrow(/must be used within a ThemeContextProvider/);
  });

  it("flips its aria-label and the document theme on click", async () => {
    localStorage.setItem("theme", "light");
    render(
      <ThemeContextProvider>
        <ThemeSwitch />
      </ThemeContextProvider>,
    );

    const button = screen.getByRole("button", { name: "Switch to dark theme" });
    button.click();

    expect(
      await screen.findByRole("button", { name: "Switch to light theme" }),
    ).toBeInTheDocument();
    expect(document.documentElement).toHaveClass("dark");

    screen.getByRole("button").click();

    expect(
      await screen.findByRole("button", { name: "Switch to dark theme" }),
    ).toBeInTheDocument();
    expect(document.documentElement).not.toHaveClass("dark");
  });
});
