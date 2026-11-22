import type { Note } from "@/lib/devlog";

export const MAP_WIDTH = 840;
export const COVER_WIDTH = 76;
export const COVER_GAP = 7;
const COVER_HEIGHT = COVER_WIDTH * 2 / 3;

type Point = { x: number; y: number };
type Station = Point & {
  id: number;
  note: Note;
  rail: number;
  memberships: number[];
  incoming: number;
  coverSide?: "above" | "below";
};
type Connection = { from: Station; to: Station };

export function caseKind(note: Note) {
  if (note.section === "Debug cases") return "debug";
  if (note.section === "Design cases") return "design";
}

export function coverBounds(station: Station, boardWidth: number) {
  const scale = boardWidth / MAP_WIDTH;
  return {
    x: (station.x - COVER_WIDTH / 2) * scale,
    y: (station.y + (station.coverSide === "below" ? COVER_GAP : -COVER_GAP - COVER_HEIGHT)) * scale,
    width: COVER_WIDTH * scale,
    height: COVER_HEIGHT * scale,
  };
}

export function angledLink(from: Point, to: Point) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const diagonal = Math.min(18, Math.abs(dx), Math.abs(dy));
  const x = from.x + Math.sign(dx) * diagonal;
  const y = from.y + Math.sign(dy) * diagonal;
  return `M${from.x} ${from.y}L${x} ${y}V${to.y}H${to.x}`;
}

export function layoutLineMap(notes: Note[], topics: Note[]) {
  const topicSlugs = topics.map(note => note.slug);
  const entries: Station[] = notes.map((note, id) => {
    const memberships = topics.flatMap((topic, index) => topic.links.includes(note.slug) ? [index] : []);
    const topic = topicSlugs.indexOf(note.slug);
    return { id, note, memberships, rail: topic >= 0 ? topic : memberships[0] ?? -1, incoming: 0, x: 0, y: 0 };
  });
  const bySlug = new Map(entries.map(entry => [entry.note.slug, entry]));
  const neighbours = entries.map(() => new Set<Station>());
  const edges = new Map<string, Connection>();
  let linkCount = 0;
  for (const from of entries) {
    for (const slug of from.note.links) {
      const to = bySlug.get(slug);
      if (!to) continue;
      linkCount++;
      to.incoming++;
      neighbours[from.id].add(to);
      neighbours[to.id].add(from);
      const key = from.id < to.id ? `${from.id}:${to.id}` : `${to.id}:${from.id}`;
      if (!edges.has(key)) edges.set(key, { from, to });
    }
  }

  // Connections can place a note near a topic without changing its authored memberships.
  const queue = entries.filter(entry => entry.rail >= 0).sort((a, b) => a.rail - b.rail);
  for (const entry of queue) {
    for (const neighbour of neighbours[entry.id]) {
      if (neighbour.rail >= 0) continue;
      neighbour.rail = entry.rail;
      queue.push(neighbour);
    }
  }

  let top = 8;
  const branches: Connection[] = [];
  const rails = topics.map((topic, rail) => {
    const origin = bySlug.get(topic.slug)!;
    const cases = entries.filter(entry => entry.rail === rail && caseKind(entry.note)).reverse();
    const marks = entries.filter(entry => entry.rail === rail && entry !== origin && !caseKind(entry.note));
    const coverCount = cases.filter(entry => entry.note.cover).length;
    const y = top + (coverCount ? 61 : 32);
    origin.x = 34;
    origin.y = y;

    const spacing = Math.min(86, 514 / Math.max(1, cases.length - 1));
    let coverIndex = 0;
    cases.forEach((entry, index) => {
      entry.x = Math.round(280 + index * spacing);
      entry.y = y;
      if (entry.note.cover) entry.coverSide = coverIndex++ % 2 ? "below" : "above";
    });

    const markY = y + (coverCount >= 2 ? 69 : 20);
    const slots = Array.from({ length: Math.ceil(marks.length / 21) * 21 }, (_, index) => ({
      x: 140 + (index % 21) * 32,
      y: markY + Math.floor(index / 21) * 17,
    }));
    marks.forEach((entry, index) => {
      const parent = cases.find(candidate => neighbours[entry.id].has(candidate));
      const preferred = parent?.x ?? 150 + (index * 79) % 647;
      const nearest = slots.reduce((best, slot, i) => {
        const score = (p: Point) => Math.abs(p.x - preferred) + (p.y - markY) * .8;
        return score(slot) < score(slots[best]) ? i : best;
      }, 0);
      const [slot] = slots.splice(nearest, 1);
      Object.assign(entry, slot);
      if (parent) branches.push({ from: parent, to: entry });
    });
    top = (marks.length ? markY + (Math.ceil(marks.length / 21) - 1) * 17 : markY) + 16;
    return { slug: topic.slug, y, rail };
  });

  const detached = entries.filter(entry => entry.rail < 0);
  // Keep standalone cases readable when the notebook has yet to link them to a topic.
  const detachedCases = detached.filter(entry => caseKind(entry.note));
  detachedCases.forEach((entry, index) => {
    entry.x = 56 + index % 9 * 91;
    entry.y = top + 59 + Math.floor(index / 9) * 70;
    entry.rail = topics.length + Math.floor(index / 9);
    if (entry.note.cover) entry.coverSide = "above";
  });
  top += Math.ceil(detachedCases.length / 9) * 70;
  const detachedMarks = detached.filter(entry => !caseKind(entry.note));
  detachedMarks.forEach((entry, index) => {
    entry.x = 36 + index % 37 * 21;
    entry.y = top + 11 + Math.floor(index / 37) * 19;
    entry.rail = topics.length + Math.ceil(detachedCases.length / 9) + Math.floor(index / 37);
  });
  top += Math.ceil(detachedMarks.length / 37) * 19;

  return { stations: entries, rails, branches, edges: [...edges.values()], linkCount, height: top + 3 };
}
