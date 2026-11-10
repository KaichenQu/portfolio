import Image from "next/image";
import NextLink from "next/link";
import clsx from "clsx";
import type { Note } from "@/lib/devlog";
import { mosaic } from "@/components/blog/mosaic";
import { StatusDot } from "@/components/blog/note-list";

/** The shell of the home page's project cards, so both grids read as one family. */
export const CARD_SHELL =
  "group/card flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200/70 bg-white/50 transition-all duration-300 hover:-translate-y-0.5 hover:border-sky-300/60 hover:bg-white hover:shadow-lg hover:shadow-sky-500/5 focus-visible:border-sky-400/60 motion-reduce:transition-none motion-reduce:hover:translate-y-0 dark:border-white/[0.08] dark:bg-white/[0.02] dark:hover:border-sky-500/30 dark:hover:bg-white/[0.04] dark:focus-visible:border-sky-400/40";

const BOX =
  "relative aspect-[3/2] overflow-hidden border-b border-gray-200/70 dark:border-white/[0.08]";
const ZOOM =
  "transition-transform duration-500 group-hover/card:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover/card:scale-100";

function Cover({ cover }: { cover: Note["cover"] }) {
  if (!cover)
    return (
      <div
        aria-hidden
        data-cover="none"
        className={clsx(
          BOX,
          "bg-gray-50 bg-[radial-gradient(#d1d5db_1px,transparent_1px)] [background-size:14px_14px] dark:bg-white/[0.02] dark:bg-[radial-gradient(rgb(255_255_255/0.08)_1px,transparent_1px)]",
        )}
      />
    );
  const art = cover.kind === "art";
  return (
    // Diagrams paint their own white background, so their surface stays white in dark mode.
    // The image is out of flow: its intrinsic size would otherwise outgrow the aspect ratio.
    <div
      data-cover={cover.kind}
      className={clsx(BOX, art ? "bg-gray-100 dark:bg-white/[0.04]" : "bg-white")}
    >
      <Image
        src={cover.src}
        alt={cover.alt}
        width={cover.width}
        height={cover.height}
        loading="lazy"
        decoding="async"
        unoptimized
        className={clsx(
          "absolute inset-0 h-full w-full",
          art ? "object-cover" : "object-contain p-4",
          ZOOM,
        )}
      />
    </div>
  );
}

const KIND: Partial<Record<Note["section"], string>> = {
  "Debug cases": "Debug",
  "Design cases": "Design",
};

/** One case on the index: cover, type and status, title, summary, then date and reading time. */
export function NoteCard({ note }: { note: Note }) {
  return (
    <NextLink href={`/blog/${note.slug}`} className={CARD_SHELL}>
      <Cover cover={note.cover} />
      <div className="flex flex-1 flex-col p-4">
        <div
          data-kicker
          className="flex items-center justify-between gap-3 whitespace-nowrap font-mono text-[11px] font-medium uppercase leading-none tracking-[0.14em]"
        >
          <span className="min-w-0 truncate text-sky-600 dark:text-sky-400">
            {KIND[note.section] ?? note.section}
          </span>
          <StatusDot
            status={note.status}
            className="text-gray-500 dark:text-white/50"
          />
        </div>
        <h3 className="mt-3 line-clamp-2 text-[17px] font-semibold leading-[1.3] tracking-tight text-gray-900 dark:text-white">
          {mosaic(note.title)}
        </h3>
        {note.summary && (
          <p className="mt-2 line-clamp-3 text-[14px] leading-[1.6] text-gray-600 dark:text-white/60">
            {mosaic(note.summary)}
          </p>
        )}
        <div className="mt-auto flex gap-2 pt-4 font-mono text-[12px] leading-none text-gray-500 dark:text-white/45">
          {note.date && (
            <>
              <time dateTime={note.date}>{note.date}</time>
              <span aria-hidden>·</span>
            </>
          )}
          <span>{note.readingMinutes} min read</span>
        </div>
      </div>
    </NextLink>
  );
}
