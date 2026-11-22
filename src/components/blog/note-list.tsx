import Image from "next/image";
import NextLink from "next/link";
import clsx from "clsx";
import type { Note } from "@/lib/devlog";
import { blogPath, sectionLabel, type BlogLocale } from "@/lib/blog-locale";
import { mosaic } from "@/components/blog/mosaic";

const STATUS: Record<string, string> = {
  solved:
    "text-green-700 bg-green-50 border-green-200 dark:text-green-300 dark:bg-green-400/10 dark:border-green-400/20",
  open: "text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-400/10 dark:border-amber-400/20",
  wip: "text-sky-700 bg-sky-50 border-sky-200 dark:text-sky-300 dark:bg-sky-400/10 dark:border-sky-400/20",
};

const ZH_STATUS: Record<string, string> = {
  solved: "已解决",
  open: "待解决",
  wip: "进行中",
};

export function StatusBadge({ status, locale = "en" }: { status?: string; locale?: BlogLocale }) {
  if (!status) return null;
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider",
        STATUS[status] ??
          "text-gray-600 border-gray-200 dark:text-white/60 dark:border-white/10",
      )}
    >
      {locale === "zh-Hans" ? ZH_STATUS[status] ?? status : status}
    </span>
  );
}

const DOT: Record<string, string> = {
  solved: "bg-green-500",
  wip: "bg-sky-500",
  open: "bg-amber-500",
};

/** The status as a coloured dot and its word, sized to sit inside a line of meta text. */
export function StatusDot({
  status,
  className,
  locale = "en",
}: {
  status?: string;
  className?: string;
  locale?: BlogLocale;
}) {
  if (!status) return null;
  return (
    <span
      data-status={status}
      className={clsx(
        className,
        "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap",
      )}
    >
      <span
        aria-hidden
        className={clsx(
          "h-1.5 w-1.5 rounded-full",
          DOT[status] ?? "bg-gray-400",
        )}
      />
      {locale === "zh-Hans" ? ZH_STATUS[status] ?? status : status}
    </span>
  );
}

export function TagList({ tags, locale = "en" }: { tags: string[]; locale?: BlogLocale }) {
  if (tags.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-1.5">
      {tags.map((t) => (
        <li key={t}>
          <NextLink
            href={blogPath(locale, `/tags/${encodeURIComponent(t)}`)}
            className="inline-block rounded-full border border-gray-200 bg-white px-2.5 py-0.5 font-mono text-[11.5px] text-gray-600 transition-colors hover:border-sky-400/60 hover:text-gray-900 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/65 dark:hover:text-white"
          >
            #{t}
          </NextLink>
        </li>
      ))}
    </ul>
  );
}

/** Section, date and status, as one wrapping row. */
export function NoteMeta({
  note,
  className,
  locale = "en",
}: {
  note: Note;
  className?: string;
  locale?: BlogLocale;
}) {
  return (
    <span
      className={clsx(
        className,
        "flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-gray-500 dark:text-white/45",
      )}
    >
      <span className="font-mono uppercase tracking-wider text-sky-600 dark:text-sky-400">
        {sectionLabel(note.section, locale)}
      </span>
      {note.date && (
        <time dateTime={note.date} className="font-mono">
          {note.date}
        </time>
      )}
      <StatusDot
        status={note.status}
        locale={locale}
        className="font-mono uppercase tracking-wider"
      />
    </span>
  );
}

function RowText({ note, locale }: { note: Note; locale: BlogLocale }) {
  return (
    <>
      <span className="block text-[15px] font-semibold leading-[1.4] text-gray-900 dark:text-white/90">
        {mosaic(note.title, locale)}
      </span>
      {note.summary && (
        <span className="mt-0.5 line-clamp-1 text-[14px] leading-[1.6] text-gray-600 dark:text-white/60">
          {mosaic(note.summary, locale)}
        </span>
      )}
      <NoteMeta note={note} locale={locale} className="mt-1.5" />
    </>
  );
}

/** One row per note: title, summary, then section, date and status; its cover on the right from `sm`. */
export function NoteList({ notes, locale = "en" }: { notes: Note[]; locale?: BlogLocale }) {
  return (
    <ul className="divide-y divide-gray-200/70 overflow-hidden rounded-xl border border-gray-200 bg-white/70 dark:divide-white/[0.06] dark:border-white/10 dark:bg-white/[0.03]">
      {notes.map((n) => (
        <li key={n.slug}>
          <NextLink
            href={blogPath(locale, `/${n.slug}`)}
            className={clsx(
              "px-4 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.04]",
              n.cover ? "flex items-center gap-4" : "block",
            )}
          >
            {n.cover ? (
              <>
                <span className="block min-w-0 flex-1">
                  <RowText note={n} locale={locale} />
                </span>
                <Image
                  src={n.cover.src}
                  alt=""
                  width={n.cover.width}
                  height={n.cover.height}
                  unoptimized
                  className={clsx(
                    "hidden h-16 w-24 shrink-0 rounded-md border border-gray-200 sm:block dark:border-white/15",
                    n.cover.kind === "art"
                      ? "object-cover dark:brightness-90"
                      : "bg-white object-contain p-1",
                  )}
                />
              </>
            ) : (
              <RowText note={n} locale={locale} />
            )}
          </NextLink>
        </li>
      ))}
    </ul>
  );
}
