import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import Footer from "./footer";

const usePathname = vi.fn();
vi.mock("next/navigation", () => ({ usePathname: () => usePathname() }));

beforeEach(() => {
  usePathname.mockReturnValue("/about");
});

describe("Footer", () => {
  it("renders nothing on the home page", () => {
    usePathname.mockReturnValue("/");
    const { container } = render(<Footer />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders the current copyright year elsewhere", () => {
    render(<Footer />);

    expect(screen.getByRole("contentinfo")).toHaveTextContent(
      `© ${new Date().getFullYear()} Kelson Qu`,
    );
  });

  it("marks every external anchor rel='noopener noreferrer'", () => {
    render(<Footer />);

    const links = screen.getAllByRole("link");
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    }
  });
});
