import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import ActiveSectionContextProvider from "@/containers/active-section";
import type { Link } from "@/lib/types";
import Header from "./header";

const usePathname = vi.fn();
vi.mock("next/navigation", () => ({ usePathname: () => usePathname() }));

const links: Link[] = [
  { nameEng: "Home", hash: "/" },
  { nameEng: "About", hash: "/#about" },
  { nameEng: "Blog", hash: "https://blog.example.com" },
];

const renderHeader = () =>
  render(
    <ActiveSectionContextProvider>
      <Header links={links} />
    </ActiveSectionContextProvider>,
  );

beforeEach(() => {
  usePathname.mockReturnValue("/about");
});

describe("Header", () => {
  it("renders nothing on the home page", () => {
    usePathname.mockReturnValue("/");
    const { container } = renderHeader();

    expect(container).toBeEmptyDOMElement();
  });

  it("renders one navigation entry per link elsewhere", () => {
    renderHeader();

    expect(screen.getByRole("navigation", { name: "Main" })).toBeInTheDocument();
    for (const link of links) {
      expect(screen.getByRole("link", { name: link.nameEng })).toBeInTheDocument();
    }
  });

  it("opens absolute links in a new tab with rel='noopener noreferrer'", () => {
    renderHeader();

    const external = screen.getByRole("link", { name: "Blog" });
    expect(external).toHaveAttribute("target", "_blank");
    expect(external).toHaveAttribute("rel", "noopener noreferrer");

    const internal = screen.getByRole("link", { name: "About" });
    expect(internal).not.toHaveAttribute("target");
  });
});
