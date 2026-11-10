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

    expect(
      screen.getByRole("navigation", { name: "Main" }),
    ).toBeInTheDocument();
    for (const link of links) {
      expect(
        screen.getByRole("link", { name: link.nameEng }),
      ).toBeInTheDocument();
    }
  });

  it.each(["/blog", "/blog/some-note"])(
    "renders nothing on %s, where the blog column carries the nav",
    (pathname) => {
      usePathname.mockReturnValue(pathname);
      const { container } = renderHeader();

      expect(container).toBeEmptyDOMElement();
    },
  );
});
