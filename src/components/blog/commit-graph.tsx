import NextLink from "next/link";
import { blogPath, type BlogLocale } from "@/lib/blog-locale";
import type { Note } from "@/lib/devlog";
import CoverArt from "./cover-art";
import { caseKind } from "./line-map-layout";
import { mosaic } from "./mosaic";

export default function CommitGraph({ cases, locale, title, date, caseName, noMatches }: {
  cases: Note[];
  locale: BlogLocale;
  title: string;
  date: string;
  caseName: string;
  noMatches: string;
}) {
  return (
    <section className="index-cases" aria-labelledby="index-cases-title">
      <h2 id="index-cases-title" tabIndex={-1} className="scroll-mt-4 border-b px-4 py-2.5 text-base font-semibold">
        {title}
      </h2>
      <div className="index-graph-head font-mono" aria-hidden="true">
        <span>{date}</span>
        <span className="index-lane-labels"><span>debug</span><span>design</span></span>
        <span>{caseName}</span>
      </div>
      <p className="px-4 py-3 text-sm" data-empty-cases hidden>{noMatches}</p>
      <ol>
        {cases.map((note, index) => {
          const kind = caseKind(note);
          return (
            <li key={note.slug} className="index-case-row" data-case-row data-type={note.type}
              data-status={note.status} data-lead={index === 0 ? "" : undefined}>
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
