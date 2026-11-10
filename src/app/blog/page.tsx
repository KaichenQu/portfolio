import NextLink from "next/link";
import { NoteList } from "@/components/blog/note-list";
import { getNotes } from "@/lib/devlog";
import { pageMetadata } from "@/lib/seo";

const DESCRIPTION =
  "An engineering notebook: how a bug was tracked down step by step, and how architecture and design trade-offs were made.";

export const metadata = pageMetadata("/blog", "DevLog", DESCRIPTION);

export default function BlogIndex() {
  const notes = getNotes();
  const maps = notes.filter((n) => n.section === "Maps");
  const cases = notes.filter(
    (n) => n.section === "Debug cases" || n.section === "Design cases",
  );

  return (
    <main>
      <h1 className="text-[2.25rem] font-bold tracking-[-0.02em] text-gray-950 dark:text-white">
        DevLog
      </h1>
      <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-gray-600 dark:text-white/65">
        {DESCRIPTION}
      </p>

      {notes.length === 0 ? (
        <p className="mt-10 text-gray-500 dark:text-white/50">No notes yet.</p>
      ) : (
        <>
          {maps.length > 0 && (
            <section className="mt-10" aria-labelledby="maps">
              <h2
                id="maps"
                className="font-mono text-[12px] uppercase tracking-[0.18em] text-sky-600 dark:text-sky-400"
              >
                Topic maps
              </h2>
              <ul className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {maps.map((m) => (
                  <li key={m.slug}>
                    <NextLink
                      href={`/blog/${m.slug}`}
                      className="flex h-full flex-col rounded-xl border border-gray-200 bg-white/80 p-4 transition-colors hover:border-sky-400/60 dark:border-white/10 dark:bg-white/[0.04] dark:hover:border-sky-400/40"
                    >
                      <span className="font-semibold text-gray-900 dark:text-white/90">
                        {m.title}
                      </span>
                      <span className="mt-1 font-mono text-[12px] text-gray-500 dark:text-white/45">
                        {m.links.length} notes
                      </span>
                    </NextLink>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {cases.length > 0 && (
            <section className="mt-10" aria-labelledby="cases">
              <h2
                id="cases"
                className="font-mono text-[12px] uppercase tracking-[0.18em] text-sky-600 dark:text-sky-400"
              >
                Cases
              </h2>
              <div className="mt-3">
                <NoteList notes={cases} />
              </div>
            </section>
          )}
        </>
      )}
    </main>
  );
}
