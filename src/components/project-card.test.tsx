import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ProjectInfo } from "@/lib/types";
import Project from "./project-card";

const base: ProjectInfo = {
  title: "Shortlink Platform",
  description: "A full-stack shortlink service.",
  tags: ["Java", "Redis"],
  imageUrl: "/projects/shortlink-light.png",
  imageUrlDark: "/projects/shortlink-dark.png",
  link: "",
  githubUrl: "",
  demoUrl: "",
};

describe("Project card", () => {
  it("renders the title, description, tags and image", () => {
    render(<Project {...base} />);

    expect(
      screen.getByRole("heading", { name: base.title }),
    ).toBeInTheDocument();
    expect(screen.getByText(base.description)).toBeInTheDocument();
    for (const tag of base.tags)
      expect(screen.getByText(tag)).toBeInTheDocument();
    // One <img> per theme; Tailwind's dark:hidden / dark:block picks the visible one.
    expect(screen.getAllByRole("img", { name: base.title })).toHaveLength(2);
  });

  it("omits 'View more' when no link is given", () => {
    render(<Project {...base} />);

    expect(
      screen.queryByRole("link", { name: "View more" }),
    ).not.toBeInTheDocument();
  });

  it("renders 'View more' pointing at the link when one is given", () => {
    render(<Project {...base} link="https://example.com/case-study" />);

    expect(screen.getByRole("link", { name: "View more" })).toHaveAttribute(
      "href",
      "https://example.com/case-study",
    );
  });

  it("omits the github and demo anchors when their urls are empty", () => {
    render(<Project {...base} />);

    expect(screen.queryAllByRole("link")).toHaveLength(0);
  });

  it("marks every anchor target='_blank' with rel='noopener noreferrer'", () => {
    render(
      <Project
        {...base}
        link="https://example.com/case-study"
        githubUrl="https://github.com/example/repo"
        demoUrl="https://example.com/demo"
      />,
    );

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(3);
    for (const link of links) {
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    }
  });
});
