import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Note } from "@/lib/devlog";
import { NoteList } from "./note-list";

const base: Omit<Note, "slug" | "title"> = {
  section: "Debug cases",
  tags: [],
  description: "",
  readingMinutes: 1,
  links: [],
  body: "",
};

const notes: Note[] = [
  {
    ...base,
    slug: "with",
    title: "With figure",
    cover: { src: "/blog/diagrams/w.svg", alt: "w", width: 600, height: 400 },
  },
  { ...base, slug: "without", title: "Without figure" },
];

describe("NoteList", () => {
  it("puts a thumbnail on rows whose note has a cover, and none on the rest", () => {
    render(<NoteList notes={notes} />);
    const thumb = screen
      .getByRole("link", { name: /With figure/ })
      .querySelector("img");
    expect(thumb).toHaveAttribute("src", "/blog/diagrams/w.svg");
    expect(thumb).toHaveAttribute("alt", "");
    expect(thumb).toHaveAttribute("width", "600");
    expect(thumb).toHaveAttribute("height", "400");
    expect(
      screen.getByRole("link", { name: /Without figure/ }).querySelector("img"),
    ).toBeNull();
  });
});
