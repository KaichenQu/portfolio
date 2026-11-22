import { describe, expect, it } from "vitest";
import { getNotes } from "@/lib/devlog";
import { coverBounds, layoutLineMap } from "./line-map-layout";

const english = getNotes();
const order = new Map(english.map(({ slug }, index) => [slug, index]));
const chinese = [...getNotes({ locale: "zh-Hans" })].sort((a, b) =>
  (order.get(a.slug) ?? order.size) - (order.get(b.slug) ?? order.size));

describe.each([["English", english], ["Chinese", chinese]] as const)("%s line map", (_, notes) => {
  const topics = notes.filter(note => note.section === "Maps");
  const layout = layoutLineMap(notes, topics);

  it("places every published note once and gives the same result on a second run", () => {
    expect(layout.stations.map(({ note }) => note.slug)).toEqual(notes.map(note => note.slug));
    expect(new Set(layout.stations.map(({ x, y }) => `${x},${y}`)).size).toBe(notes.length);
    expect(layoutLineMap(notes, topics)).toEqual(layout);
  });

  it.each([1440, 1024])("keeps case art apart at %i px", viewport => {
    // BlogLayout caps the frame at 1280 px and allocates 160 px padding,
    // 240 px for the sidebar, and a 40 px gutter. The index has a 1 px border.
    const width = Math.min(1280, viewport) - 160 - 240 - 40 - 2;
    const covers = layout.stations.filter(station => station.coverSide);
    expect(covers).toHaveLength(notes.filter(note => note.cover && note.section.endsWith("cases")).length);
    const boxes = covers.map(station => coverBounds(station, width));
    for (const [i, a] of boxes.entries()) {
      expect(a.x).toBeGreaterThanOrEqual(0);
      expect(a.x + a.width).toBeLessThanOrEqual(width);
      if (viewport === 1440) expect(a.width).toBeGreaterThanOrEqual(64);
      for (const b of boxes.slice(i + 1)) {
        const overlap = a.x < b.x + b.width && b.x < a.x + a.width &&
          a.y < b.y + b.height && b.y < a.y + a.height;
        expect(overlap).toBe(false);
      }
    }
  });
});
