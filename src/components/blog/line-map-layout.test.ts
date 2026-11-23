import { describe, expect, it } from "vitest";
import { getNotes } from "@/lib/devlog";
import { layoutLineMap, MAP_COVER_GAP, MAP_COVER_WIDTH } from "./line-map-layout";

const english = getNotes();
const chinese = getNotes({ locale: "zh-Hans" });

describe.each([["English", english], ["Chinese", chinese]] as const)("%s line map", (_, notes) => {
  const topics = notes.filter(note => note.section === "Maps");
  const layout = layoutLineMap(notes, topics);
  const allCases = notes.filter(note => note.section.endsWith(" cases"));

  it("places each case on every topic that links to it, in deterministic date order", () => {
    expect(layout.map(rail => rail.topic.slug)).toEqual(topics.map(topic => topic.slug));
    for (const note of allCases) {
      expect(layout.filter(rail => rail.cases.includes(note)).map(rail => rail.topic.slug))
        .toEqual(topics.filter(topic => topic.links.includes(note.slug)).map(topic => topic.slug));
    }
    for (const rail of layout) {
      expect(rail.counts.cases).toBe(rail.cases.length);
      const dates = rail.cases.map(note => note.date ?? "");
      expect(dates).toEqual([...dates].sort());
    }
    expect(layoutLineMap([...notes].reverse(), topics)).toEqual(layout);
  });

  it.each([1440, 1024])("keeps covers within separate grid cells at %i px", viewport => {
    // BlogLayout uses an 1280 px frame, 160 px padding, a 240 px sidebar and a 40 px gutter.
    // The map has 16 px on each side inside the 1 px index border.
    const width = Math.min(1280, viewport) - 160 - 240 - 40 - 2 - 32;
    const columns = Math.max(...layout.map(rail => rail.cases.length));
    const coverWidth = Math.min(MAP_COVER_WIDTH, (width - (columns - 1) * MAP_COVER_GAP) / columns);
    expect(coverWidth).toBeGreaterThanOrEqual(viewport === 1440 ? 64 : 42);
    for (const rail of layout) {
      let previousRight = 0;
      rail.cases.forEach((_, column) => {
        const left = column * (coverWidth + MAP_COVER_GAP);
        expect(left).toBeGreaterThanOrEqual(previousRight);
        previousRight = left + coverWidth;
        expect(previousRight).toBeLessThanOrEqual(width + Number.EPSILON * width);
      });
    }
  });
});
