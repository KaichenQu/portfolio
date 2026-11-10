import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Note } from "@/lib/devlog";
import { NoteList } from "./note-list";

const base: Omit<Note, "slug" | "title"> = {
  section: "Debug cases",
  tags: [],
  description: "",
  summary: "",
  readingMinutes: 1,
  links: [],
  body: "",
};

const notes: Note[] = [
  {
    ...base,
    slug: "with",
    title: "With figure",
    summary: "What the figure shows.",
    status: "open",
    cover: {
      kind: "diagram",
      src: "/blog/diagrams/w.svg",
      alt: "w",
      width: 600,
      height: 400,
    },
  },
  {
    ...base,
    slug: "art",
    title: "With art",
    cover: {
      kind: "art",
      src: "/blog/covers/art.webp",
      alt: "",
      width: 1200,
      height: 800,
    },
  },
  { ...base, slug: "without", title: "Without figure" },
];

const row = (name: RegExp) => screen.getByRole("link", { name });

describe("NoteList", () => {
  it("puts a thumbnail on rows whose note has a cover, and none on the rest", () => {
    render(<NoteList notes={notes} />);
    const thumb = row(/With figure/).querySelector("img");
    expect(thumb).toHaveAttribute("src", "/blog/diagrams/w.svg");
    expect(thumb).toHaveAttribute("alt", "");
    expect(thumb).toHaveAttribute("width", "600");
    expect(thumb).toHaveAttribute("height", "400");
    expect(row(/Without figure/).querySelector("img")).toBeNull();
  });

  it("fits a diagram thumbnail and fills an art one", () => {
    render(<NoteList notes={notes} />);
    expect(row(/With figure/).querySelector("img")).toHaveClass(
      "object-contain",
      "bg-white",
    );
    expect(row(/With art/).querySelector("img")).toHaveClass("object-cover");
    expect(row(/With art/).querySelector("img")).not.toHaveClass("bg-white");
  });

  it("shows the summary on one line and the status as a dot", () => {
    render(<NoteList notes={notes} />);
    expect(screen.getByText("What the figure shows.")).toHaveClass(
      "line-clamp-1",
    );
    const status = screen.getByText("open");
    expect(status).toHaveAttribute("data-status", "open");
    expect(status).not.toHaveClass("border");
    expect(status.querySelector(".rounded-full")).toHaveClass("bg-amber-500");
  });
});
