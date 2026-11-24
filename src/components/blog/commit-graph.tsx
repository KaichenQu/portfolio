import NextLink from "next/link";
import type { ReactNode } from "react";
import { blogPath, type BlogLocale } from "@/lib/blog-locale";
import type { Note } from "@/lib/devlog";
import CoverArt from "./cover-art";
import { mosaic } from "./mosaic";

export function caseKind(note: Note) {
  if (note.section === "Debug cases") return "debug";
  if (note.section === "Design cases") return "design";
}

export default function CommitGraph({ cases, caseTopics, locale, title, date, noMatches, children }: {
  cases: Note[];
  caseTopics: Map<string, number[]>;
  locale: BlogLocale;
  title: string;
  date: string;
  noMatches: string;
  children: ReactNode;
}) {
  return (
    <section className="index-cases" aria-labelledby="index-cases-title">
      <h2 id="index-cases-title" tabIndex={-1} className="index-section-title scroll-mt-4">{title}</h2>
      {children}
      <div className="index-graph-head font-mono" aria-hidden="true">
        <span>{date}</span>
        <span className="index-lane-labels"><span>debug</span><span>design</span></span>
      </div>
      <p className="index-empty-cases index-muted px-4 py-3 text-sm" data-empty-cases={cases.length > 0 ? "" : undefined} role="status">{noMatches}</p>
      <ol>
        {cases.map((note, index) => {
          const kind = caseKind(note);
          return (
            <li key={note.slug} className="index-case-row" data-case-topics={caseTopics.get(note.slug)?.join(" ") ?? ""}>
              <NextLink href={blogPath(locale, `/${note.slug}`)} className="index-case-link" data-case-link data-kind={kind}
                aria-labelledby={`case-${note.slug}`}>
                <div className="index-case-date font-mono">{note.date && <time dateTime={note.date}>{note.date}</time>}</div>
                <div className="index-case-lanes" aria-hidden="true"><span /></div>
                <div className="index-case-copy">
                  <h3 id={`case-${note.slug}`} className="index-case-title">{mosaic(note.title, locale)}</h3>
                  <div className="index-case-meta font-mono">
                    <span>{kind}</span>
                    {note.status && <span className="index-ref" data-ref={note.status}>{note.status}</span>}
                  </div>
                </div>
                <div className="index-case-cover" data-depth>
                  <div className="index-cover-object"><CoverArt note={note} priority={index === 0} /></div>
                </div>
              </NextLink>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
