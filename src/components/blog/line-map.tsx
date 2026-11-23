import NextLink from "next/link";
import type { CSSProperties } from "react";
import { blogPath, type BlogLocale } from "@/lib/blog-locale";
import type { Note } from "@/lib/devlog";
import CoverArt from "./cover-art";
import { caseKind, layoutLineMap, MAP_COVER_GAP, MAP_COVER_WIDTH, type TopicCounts } from "./line-map-layout";
import { mosaic } from "./mosaic";

export default function LineMap({ notes, topics, locale, title, countLabels }: {
  notes: Note[];
  topics: Note[];
  locale: BlogLocale;
  title: string;
  countLabels: Record<keyof TopicCounts, [singular: string, plural: string]>;
}) {
  const rails = layoutLineMap(notes, topics);
  const columns = Math.max(1, ...rails.map(rail => rail.cases.length));

  return (
    <section aria-labelledby="index-map-title" className="index-map hidden border-b md:block" data-line-map
      style={{ "--map-columns": columns, "--map-cover-width": `${MAP_COVER_WIDTH}px`, "--map-cover-gap": `${MAP_COVER_GAP}px` } as CSSProperties}>
      <h2 id="index-map-title" className="index-section-title">{title}</h2>
      <ul>
        {rails.map(({ topic, counts, cases }, rail) => {
          const countId = `index-topic-counts-${rail}`;
          const summary = (Object.entries(counts) as [keyof TopicCounts, number][])
            .filter(([, count]) => count > 0)
            .map(([kind, count]) => `${count} ${countLabels[kind][count === 1 ? 0 : 1]}`)
            .join(" · ");
          return (
            <li key={topic.slug} className="index-map-rail" data-rail-color={rail % 5}>
              <div className="index-map-topic font-mono">
                <NextLink className="index-topic-name" href={blogPath(locale, `/${topic.slug}`)} prefetch={false}
                  aria-describedby={summary ? countId : undefined} data-map-link data-rail={rail}>
                  {mosaic(topic.title, locale)}
                </NextLink>
                {summary && <span id={countId} className="index-topic-count tabular-nums">{summary}</span>}
              </div>
              {cases.length > 0 && (
                <ol className="index-map-covers">
                  {cases.map(note => {
                    const id = `index-map-${rail}-${note.slug}`;
                    const meta = [note.date, note.status].filter(Boolean).join(" · ");
                    return (
                      <li key={note.slug} data-map-case={note.slug} data-type={`case-${caseKind(note)}`} data-status={note.status}>
                        <NextLink className="index-map-station" href={blogPath(locale, `/${note.slug}`)} prefetch={false}
                          aria-labelledby={id} aria-describedby={meta ? `${id}-meta` : undefined}
                          data-map-link data-rail={rail} data-links={note.links.join(" ")} data-date={note.date}>
                          <span id={id} className={note.cover ? "index-map-note-title sr-only" : "index-map-note-title index-map-cover-fallback"}>
                            {mosaic(note.title, locale)}
                          </span>
                          {meta && <span id={`${id}-meta`} className="sr-only">{meta}</span>}
                          {note.cover && (
                            <span className="index-map-cover" data-depth>
                              <span className="index-cover-object"><CoverArt note={note} /></span>
                            </span>
                          )}
                        </NextLink>
                      </li>
                    );
                  })}
                </ol>
              )}
            </li>
          );
        })}
      </ul>
      <div className="index-map-tooltip" aria-hidden="true" hidden data-map-tooltip>
        <div className="index-map-tooltip-title" />
        <div className="index-map-tooltip-meta font-mono">
          <time />
          <span />
        </div>
      </div>
    </section>
  );
}
