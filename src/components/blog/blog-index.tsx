import NextLink from "next/link";
import { mosaic } from "@/components/blog/mosaic";
import { NoteList } from "@/components/blog/note-list";
import { LanguageLink, languageAlternates } from "@/components/blog/language-link";
import { CARD_SHELL, NoteCard } from "@/components/blog/note-card";
import { getNotes, SECTIONS } from "@/lib/devlog";
import { blogPath, sectionLabel, noteCount, type BlogLocale } from "@/lib/blog-locale";
import { pageMetadata } from "@/lib/seo";

const CASE_SECTIONS = ["Debug cases", "Design cases"] as const;

const COPY = {
  en: {
    title: "DevLog",
    description:
      "An engineering notebook: how a bug was tracked down step by step, and how architecture and design trade-offs were made.",
  },
  "zh-Hans": {
    title: "工程笔记",
    description: "记录软件故障的排查过程，以及架构和设计中的取舍。",
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
  const { title, description } = COPY[locale];
  const notes = getNotes({ locale });
  const maps = notes.filter((n) => n.section === "Maps");
  const cases = notes.filter((n) => CASE_SECTIONS.some((section) => n.section === section));
  const caseGroups = zh
    ? CASE_SECTIONS.map((section, i) => ({
        id: `cases-${i}`,
        title: sectionLabel(section, locale),
        items: cases.filter((n) => n.section === section),
      }))
    : [{ id: "cases", title: "Cases", items: cases }];

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
          {zh ? "暂无笔记。" : "No notes yet."}
        </p>
      ) : (
        <>
          {caseGroups.filter(({ items }) => items.length > 0).map(({ id, title, items }) => (
            <section key={id} className="mt-10" aria-labelledby={id}>
              <h2
                id={id}
                className="font-mono text-[12px] font-medium uppercase leading-none tracking-[0.18em] text-sky-600 dark:text-sky-400"
              >
                {title}
              </h2>
              <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((n) => (
                  <li key={n.slug}>
                    <NoteCard note={n} locale={locale} />
                  </li>
                ))}
              </ul>
            </section>
          ))}

          {maps.length > 0 && (
            <section className="mt-10" aria-labelledby="maps">
              <h2
                id="maps"
                className="font-mono text-[12px] font-medium uppercase leading-none tracking-[0.18em] text-sky-600 dark:text-sky-400"
              >
                {zh ? sectionLabel("Maps", locale) : "Topic maps"}
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
          {zh && SECTIONS.map(([folder, section]) => {
            if (folder === "Maps" || folder.startsWith("Cases/")) return null;
            const items = notes.filter((n) => n.section === section);
            if (items.length === 0) return null;
            return (
              <section key={folder} className="mt-10" aria-labelledby={`section-${folder}`}>
                <h2
                  id={`section-${folder}`}
                  className="mb-4 font-mono text-[12px] font-medium uppercase leading-none tracking-[0.18em] text-sky-600 dark:text-sky-400"
                >
                  {sectionLabel(section, locale)}
                </h2>
                <NoteList notes={items} locale={locale} />
              </section>
            );
          })}
        </>
      )}
    </main>
  );
}
