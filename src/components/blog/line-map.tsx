import NextLink from "next/link";
import type { CSSProperties } from "react";
import { blogPath, type BlogLocale } from "@/lib/blog-locale";
import type { Note } from "@/lib/devlog";
import { mosaic } from "./mosaic";
import CoverArt from "./cover-art";
import { angledLink, COVER_GAP, COVER_WIDTH, layoutLineMap, MAP_WIDTH } from "./line-map-layout";

type LineMapCopy = {
  mapsTitle: string;
  graphNotes: string;
  graphLinks: string;
  path: string;
  type: string;
  status: string;
  date: string;
  out: string;
  in: string;
};

const POS = (value: number) => (100 * value / MAP_WIDTH).toFixed(5);
const railColor = (rail: number) => rail % 5;

export default function LineMap({ notes, topics, locale, copy }: {
  notes: Note[];
  topics: Note[];
  locale: BlogLocale;
  copy: LineMapCopy;
}) {
  const { stations, rails, edges, branches, linkCount, height } = layoutLineMap(notes, topics);
  return (
    <section aria-label={copy.mapsTitle} className="index-map hidden md:block">
      <div
        className="index-map-board"
        style={{
          aspectRatio: `${MAP_WIDTH} / ${height}`,
          "--map-cover": `${POS(COVER_WIDTH)}cqw`,
          "--map-cover-gap": `${POS(COVER_GAP)}cqw`,
        } as CSSProperties}
      >
        <svg className="index-map-lines" viewBox={`0 0 ${MAP_WIDTH} ${height}`} aria-hidden="true">
          {rails.map(({ slug, rail, y }) => (
            <path key={slug} className="index-map-rail" data-rail-color={railColor(rail)}
              d={`M34 ${y}H91l14 14h17l14 -14H809`} />
          ))}
          {branches.map(({ from, to }) => (
            <path key={to.id} className="index-map-branch" data-rail-color={railColor(from.rail)}
              data-from={from.id} data-to={to.id} d={angledLink(from, to)} />
          ))}
          {edges.map(({ from, to }) => (
            <path key={`${from.id}:${to.id}`} className="index-map-edge"
              data-from={from.id} data-to={to.id} d={angledLink(from, to)} />
          ))}
        </svg>
        {stations.map(({ id, x, y, note, rail, coverSide, memberships, incoming }) => {
          const topic = note.section === "Maps";
          const share = 100 / memberships.length;
          const titleId = `index-station-title-${id}`;
          return (
            <NextLink key={note.slug} className="index-map-station" href={blogPath(locale, `/${note.slug}`)} prefetch={false}
              aria-labelledby={titleId} data-station={id} data-x={x} data-rail={rail}
              data-rail-color={rail < topics.length ? railColor(rail) : undefined}
              data-type={note.type} data-status={note.status} data-date={note.date}
              data-path={note.sourcePath} data-out={note.links.length} data-in={incoming}
              data-topic={topic ? "" : undefined} data-cover-side={coverSide}
              data-label-side={x < 145 ? "start" : x > 695 ? "end" : undefined}
              data-interchange={memberships.length > 1 ? "" : undefined}
              style={{
                left: `${POS(x)}%`,
                top: `${(100 * y / height).toFixed(5)}%`,
                "--map-ring": memberships.length > 1
                  ? `conic-gradient(${memberships.map((member, i) => `var(--rail-${railColor(member)}) ${i * share}% ${(i + 1) * share}%`).join(",")})`
                  : undefined,
              } as CSSProperties}
            >
              <span className="index-station-dot" aria-hidden="true" />
              <span id={titleId} className={`index-station-title ${topic ? "index-topic-name font-mono" : "sr-only"}`}>
                {mosaic(note.title, locale)}
              </span>
              {coverSide && (
                <span className="index-map-cover" data-depth>
                  <span className="index-cover-object"><CoverArt note={note} /></span>
                </span>
              )}
            </NextLink>
          );
        })}
        <span className="index-map-tooltip" aria-hidden="true" hidden data-map-tooltip />
      </div>
      <div className="index-map-status font-mono">
        <span data-map-idle>{notes.length} {copy.graphNotes}<span className="index-status-divider" />{linkCount} {copy.graphLinks}</span>
        <span data-map-detail hidden>
          {(["path", "type", "status", "date", "out", "in"] as const).map(field => (
            <span key={field} className={field === "path" ? "index-map-path" : undefined}>
              {copy[field]} <span data-map-value={field}>—</span>
            </span>
          ))}
        </span>
      </div>
    </section>
  );
}
