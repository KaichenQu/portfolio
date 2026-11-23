import NextLink from "next/link";
import { blogPath, type BlogLocale } from "@/lib/blog-locale";
import type { Note } from "@/lib/devlog";
import { CASE_FILTERS } from "./case-filters";
import CoverArt from "./cover-art";
import { caseKind } from "./line-map-layout";
import { mosaic } from "./mosaic";

export default function CommitGraph({ cases, locale, title, date, noMatches, filterLabels }: {
  cases: Note[];
  locale: BlogLocale;
  title: string;
  date: string;
  noMatches: string;
  filterLabels: Record<keyof typeof CASE_FILTERS, string>;
}) {
  return (
    <section className="index-cases" aria-labelledby="index-cases-title">
      <div className="index-cases-heading">
        <h2 id="index-cases-title" tabIndex={-1} className="index-section-title scroll-mt-4">{title}</h2>
        <div className="index-filters font-mono">
          {(Object.entries(CASE_FILTERS) as [keyof typeof CASE_FILTERS, string[]][]).map(([name, values]) => (
            <div key={name} className="index-filter-group" role="group" aria-label={filterLabels[name]}>
              {values.map(value => (
                <button key={value} type="button" name={name} value={value}
                  data-index-filter aria-pressed={false} disabled>
                  <span>{value.replace(/^case-/, "")}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="index-graph-head font-mono" aria-hidden="true">
        <span>{date}</span>
        <span className="index-lane-labels"><span>debug</span><span>design</span></span>
      </div>
      <p className="index-muted px-4 py-3 text-sm" data-empty-cases role="status" hidden>{noMatches}</p>
      <ol>
        {cases.map((note, index) => {
          const kind = caseKind(note);
          return (
            <li key={note.slug} className="index-case-row" data-case-row data-type={`case-${kind}`} data-status={note.status}>
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
