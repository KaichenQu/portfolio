import NextLink from "next/link";
import { mosaic } from "@/components/blog/mosaic";
import { LanguageLink, languageAlternates } from "@/components/blog/language-link";
import { CARD_SHELL, NoteCard } from "@/components/blog/note-card";
import { getNotes, type Note } from "@/lib/devlog";
import { blogPath, noteCount, type BlogLocale } from "@/lib/blog-locale";
import { pageMetadata } from "@/lib/seo";

const COPY = {
  en: {
    title: "DevLog",
    description:
      "An engineering notebook: how a bug was tracked down step by step, and how architecture and design trade-offs were made.",
    casesTitle: "Cases",
    mapsTitle: "Topic maps",
    empty: "No notes yet.",
  },
  "zh-Hans": {
    title: "工程笔记",
    description: "记录软件故障的排查过程，以及架构和设计中的取舍。",
    casesTitle: "案例",
    mapsTitle: "知识地图",
    empty: "暂无笔记。",
  },
};

export function indexMetadata(locale: BlogLocale) {
  const { title, description } = COPY[locale];
  const metadata = pageMetadata(blogPath(locale), title, description, {
    type: "website",
    locale: locale === "zh-Hans" ? "zh_CN" : "en_US",
  });
  return {
    ...metadata,
    alternates: { ...metadata.alternates, languages: languageAlternates("") },
  };
}

export default function BlogIndex({ locale }: { locale: BlogLocale }) {
  const zh = locale === "zh-Hans";
  const { title, description, casesTitle, mapsTitle, empty } = COPY[locale];
  const notes = getNotes({ locale });
  const maps = notes.filter((n) => n.section === "Maps");
  const cases = notes.filter(
    (n) => n.section === "Debug cases" || n.section === "Design cases",
  );
  if (zh && (cases.length > 0 || maps.length > 0)) {
    // Use the English index order even when translated titles sort differently.
    const order = new Map(getNotes({ locale: "en" }).map(({ slug }, i) => [slug, i]));
    const index = (note: Note) => order.get(note.slug) ?? order.size;
    cases.sort((a, b) => index(a) - index(b));
    maps.sort((a, b) => index(a) - index(b));
  }

  return (
    <main>
      <h1 className="text-[2.25rem] font-bold tracking-[-0.02em] text-gray-950 dark:text-white">
        {title}
      </h1>
      <p className="mt-3 max-w-[60ch] text-[16px] leading-[1.65] text-gray-600 dark:text-white/65">
        {description}
      </p>

      <div className="mt-3">
        <LanguageLink locale={locale} />
      </div>

      {notes.length === 0 ? (
        <p className="mt-10 text-gray-500 dark:text-white/50">
          {empty}
        </p>
      ) : (
        <>
          {cases.length > 0 && (
            <section className="mt-10" aria-labelledby="cases">
              <h2
                id="cases"
                className="font-mono text-[12px] font-medium uppercase leading-none tracking-[0.18em] text-sky-600 dark:text-sky-400"
              >
                {casesTitle}
              </h2>
              <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {cases.map((n) => (
                  <li key={n.slug}>
                    <NoteCard note={n} locale={locale} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {maps.length > 0 && (
            <section className="mt-10" aria-labelledby="maps">
              <h2
                id="maps"
                className="font-mono text-[12px] font-medium uppercase leading-none tracking-[0.18em] text-sky-600 dark:text-sky-400"
              >
                {mapsTitle}
              </h2>
              <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {maps.map((m) => (
                  <li key={m.slug}>
                    <NextLink
                      href={blogPath(locale, `/${m.slug}`)}
                      className={`${CARD_SHELL} p-4`}
                    >
                      <span className="text-[15px] font-semibold leading-[1.4] text-gray-900 dark:text-white">
                        {mosaic(m.title, locale)}
                      </span>
                      <span className="mt-1.5 font-mono text-[12px] leading-none text-gray-500 dark:text-white/45">
                        {zh ? noteCount(m.links.length, locale) : `${m.links.length} notes`}
                      </span>
                    </NextLink>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </main>
  );
}
