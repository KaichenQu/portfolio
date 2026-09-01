import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import ThemeContextProvider, { useTheme } from "./theme-context";

function mockMatchMedia(matches: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockReturnValue({
      matches,
      media: "(prefers-color-scheme: dark)",
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      onchange: null,
      dispatchEvent: vi.fn(),
    }),
  );
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove("dark");
  mockMatchMedia(true);
});

describe("useTheme", () => {
  it("throws when used outside of the provider", () => {
    expect(() => renderHook(() => useTheme())).toThrow(
      /must be used within a ThemeContextProvider/,
    );
  });
});

describe("ThemeContextProvider", () => {
  it("restores the saved theme from localStorage", () => {
    localStorage.setItem("theme", "light");
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeContextProvider });

    expect(result.current.theme).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("falls back to the system preference when nothing is saved", () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeContextProvider });

    expect(result.current.theme).toBe("light");

    mockMatchMedia(true);
    localStorage.clear();
    const dark = renderHook(() => useTheme(), { wrapper: ThemeContextProvider });
    expect(dark.result.current.theme).toBe("dark");
  });

  it("toggleTheme flips the theme, the 'dark' class and the persisted value", () => {
    localStorage.setItem("theme", "light");
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeContextProvider });

    act(() => result.current.toggleTheme());

    expect(result.current.theme).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(localStorage.getItem("theme")).toBe("dark");

    act(() => result.current.toggleTheme());

    expect(result.current.theme).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(localStorage.getItem("theme")).toBe("light");
  });
});
