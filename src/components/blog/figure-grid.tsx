import Image from "next/image";
import NextLink from "next/link";
import type { Note } from "@/lib/devlog";
import { mosaic } from "@/components/blog/mosaic";
import { NoteMeta } from "@/components/blog/note-list";

/** One card per note that has a cover, in the order given. */
export function FigureGrid({ notes }: { notes: Note[] }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {notes.map(
        (n) =>
          n.cover && (
            <li key={n.slug}>
              <NextLink
                href={`/blog/${n.slug}`}
                className="flex h-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white/80 transition-colors hover:border-sky-400/60 focus-visible:border-sky-400/60 dark:border-white/10 dark:bg-white/[0.04] dark:hover:border-sky-400/40 dark:focus-visible:border-sky-400/40"
              >
                {/* The diagrams paint their own white background, so the surface stays white in dark mode. */}
                <span className="block aspect-[16/10] border-b border-gray-200 bg-white p-3 dark:border-white/10">
                  <Image
                    src={n.cover.src}
                    alt={n.cover.alt}
                    width={n.cover.width}
                    height={n.cover.height}
                    loading="lazy"
                    decoding="async"
                    unoptimized
                    className="h-full w-full object-contain"
                  />
                </span>
                <span className="flex flex-1 flex-col gap-2 p-4">
                  <span className="line-clamp-2 font-semibold leading-snug text-gray-900 dark:text-white/90">
                    {mosaic(n.title)}
                  </span>
                  <NoteMeta note={n} className="mt-auto" />
                </span>
              </NextLink>
            </li>
          ),
      )}
    </ul>
  );
}
