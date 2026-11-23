import type { Note } from "@/lib/devlog";

export const MAP_COVER_WIDTH = 72;
export const MAP_COVER_GAP = 7;

export function caseKind(note: Note) {
  if (note.section === "Debug cases") return "debug";
  if (note.section === "Design cases") return "design";
}

export function layoutLineMap(notes: Note[], topics: Note[]) {
  const bySlug = new Map(notes.map(note => [note.slug, note]));
  return topics.map(topic => {
    const counts = { cases: 0, techniques: 0, lessons: 0, terms: 0 };
    const cases: Note[] = [];

    for (const slug of topic.links) {
      const note = bySlug.get(slug);
      if (!note) continue;
      if (caseKind(note)) {
        cases.push(note);
        counts.cases++;
      } else if (note.section === "Techniques" || note.section === "Cheatsheets") {
        counts.techniques++;
      } else if (note.section === "Lessons") {
        counts.lessons++;
      } else if (note.section === "Glossary") {
        counts.terms++;
      }
    }

    cases.sort((a, b) => (a.date ?? "").localeCompare(b.date ?? "") || a.slug.localeCompare(b.slug));
    return { topic, counts, cases };
  });
}

export type TopicCounts = ReturnType<typeof layoutLineMap>[number]["counts"];
