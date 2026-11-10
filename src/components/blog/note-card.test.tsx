import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Note } from "@/lib/devlog";
import { NoteCard } from "./note-card";

const note: Note = {
  slug: "a-case",
  title: "Requests hang behind a full pool",
  section: "Debug cases",
  date: "2026-11-05",
  tags: [],
  status: "solved",
  description: "",
  summary: "Two pools wait on each other.",
  readingMinutes: 4,
  links: [],
  body: "",
};
const art = {
  kind: "art",
  src: "/blog/covers/a-case.webp",
  alt: "",
  width: 1200,
  height: 800,
} as const;
const diagram = {
  kind: "diagram",
  src: "/blog/diagrams/d.svg",
  alt: "d",
  width: 617,
  height: 442,
} as const;

describe("NoteCard", () => {
  it("shows type, status, title, summary, date and reading time", () => {
    render(<NoteCard note={note} />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/blog/a-case");
    expect(
      screen.getByRole("heading", { level: 3, name: note.title }),
    ).toBeInTheDocument();
    expect(screen.getByText(note.summary)).toBeInTheDocument();
    expect(screen.getByText("Debug")).toBeInTheDocument();
    expect(screen.getByText("2026-11-05")).toHaveAttribute(
      "datetime",
      "2026-11-05",
    );
    expect(screen.getByText("4 min read")).toBeInTheDocument();
  });

  it("puts the status as a dot on the type's line, not as a pill", () => {
    render(<NoteCard note={note} />);
    const status = screen.getByText("solved");
    expect(status).toHaveAttribute("data-status", "solved");
    expect(status).not.toHaveClass("border");
    expect(status).not.toHaveClass("rounded-full");
    expect(status.querySelector(".rounded-full")).toHaveClass("bg-green-500");
    const kicker = status.closest("[data-kicker]")!;
    expect(kicker).toHaveClass("whitespace-nowrap");
    expect(kicker).toHaveTextContent("Debug");
    expect(status.parentElement).toBe(kicker);
  });

  it("fills the box with art and fits a diagram inside it", () => {
    const { container, rerender } = render(
      <NoteCard note={{ ...note, cover: art }} />,
    );
    expect(container.querySelector("img")).toHaveClass("object-cover");
    expect(container.querySelector("img")).toHaveAttribute("src", art.src);
    rerender(<NoteCard note={{ ...note, cover: diagram }} />);
    expect(container.querySelector("img")).toHaveClass("object-contain");
    expect(container.querySelector("img")).not.toHaveClass("object-cover");
    expect(container.querySelector("[data-cover]")).toHaveClass(
      "aspect-[3/2]",
      "bg-white",
    );
  });

  it("draws a placeholder and requests no image without a cover", () => {
    const { container } = render(<NoteCard note={note} />);
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector('[data-cover="none"]')).toHaveClass(
      "aspect-[3/2]",
    );
  });

  it("names a design case and omits an empty summary", () => {
    const { container } = render(
      <NoteCard
        note={{ ...note, section: "Design cases", summary: "", status: "wip" }}
      />,
    );
    expect(screen.getByText("Design")).toBeInTheDocument();
    expect(container.querySelector("p")).toBeNull();
    expect(
      screen.getByText("wip").querySelector(".rounded-full"),
    ).toHaveClass("bg-sky-500");
  });
});
