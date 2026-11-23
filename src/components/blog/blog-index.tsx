import NextLink from "next/link";
import { Suspense, type ComponentProps } from "react";
import { blogPath, noteCount, type BlogLocale } from "@/lib/blog-locale";
import { getNotes } from "@/lib/devlog";
import { pageMetadata } from "@/lib/seo";
import BlogIndexInteractions from "./blog-index-interactions";
import { INITIAL_FILTER_SCRIPT, INITIAL_FILTER_STYLE } from "./case-filters";
import CommitGraph from "./commit-graph";
import { LanguageLink, languageAlternates } from "./language-link";
import LineMap from "./line-map";
import { caseKind } from "./line-map-layout";
import { mosaic } from "./mosaic";
import "./blog-index.css";

type IndexCopy = {
  title: string;
  description: string;
  casesTitle: string;
  mapsTitle: string;
  empty: string;
  noMatches: string;
  date: string;
  filters: ComponentProps<typeof CommitGraph>["filterLabels"];
  counts: ComponentProps<typeof LineMap>["countLabels"];
};

const COPY: Record<BlogLocale, IndexCopy> = {
  en: {
    title: "DevLog",
    description:
      "An engineering notebook: how a bug was tracked down step by step, and how architecture and design trade-offs were made.",
    casesTitle: "Cases",
    mapsTitle: "Topic maps",
    empty: "No notes yet.",
    noMatches: "No matching cases.",
    date: "Date",
    filters: { type: "Case type", status: "Case status" },
    counts: {
      cases: ["case", "cases"],
      techniques: ["technique", "techniques"],
      lessons: ["lesson", "lessons"],
      terms: ["term", "terms"],
    },
  },
  "zh-Hans": {
    title: "工程笔记",
    description: "记录软件故障的排查过程，以及架构和设计中的取舍。",
    casesTitle: "案例",
    mapsTitle: "知识地图",
    empty: "暂无笔记。",
    noMatches: "没有匹配的案例。",
    date: "日期",
    filters: { type: "案例类型", status: "案例状态" },
    counts: {
      cases: ["篇案例", "篇案例"],
      techniques: ["项技术", "项技术"],
      lessons: ["篇教训", "篇教训"],
      terms: ["个术语", "个术语"],
    },
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
  const copy = COPY[locale];
  const notes = [...getNotes({ locale })];
  if (locale === "zh-Hans" && notes.length) {
    const order = new Map(getNotes({ locale: "en" }).map(({ slug }, i) => [slug, i]));
    notes.sort((a, b) => (order.get(a.slug) ?? order.size) - (order.get(b.slug) ?? order.size));
  }
  const topics = notes.filter(note => note.section === "Maps");
  const cases = notes.filter(caseKind);

  return (
    <main className="blog-index min-w-0 border" data-blog-index>
      {cases.length > 0 && (
        <>
          <style id={INITIAL_FILTER_STYLE} />
          <script dangerouslySetInnerHTML={{ __html: INITIAL_FILTER_SCRIPT }} />
        </>
      )}
      <header className="flex flex-wrap items-baseline gap-x-4 gap-y-2 border-b px-4 py-3 md:py-4">
        <div className="flex flex-1 flex-wrap items-baseline justify-between gap-x-3">
          <h1 className="text-[27px] font-bold leading-tight tracking-[-0.04em] md:text-[32px]">{copy.title}</h1>
          <span className="index-muted font-mono text-xs tabular-nums">{noteCount(notes.length, locale)}</span>
        </div>
        <LanguageLink locale={locale} />
      </header>
      {notes.length === 0 ? (
        <p className="index-muted px-4 py-6 text-sm">{copy.empty}</p>
      ) : (
        <>
          {topics.length > 0 && <LineMap notes={notes} topics={topics} locale={locale}
            title={copy.mapsTitle} countLabels={copy.counts} />}
          {topics.length > 0 && (
            <nav aria-label={copy.mapsTitle} className="index-topic-strip border-b md:hidden">
              <ul className="flex items-stretch overflow-x-auto font-mono">
                {topics.map(topic => (
                  <li key={topic.slug} className="shrink-0">
                    <NextLink href={blogPath(locale, `/${topic.slug}`)} prefetch={false} className="flex min-h-11 items-center gap-2 whitespace-nowrap border-r px-3 text-xs">
                      {mosaic(topic.title, locale)}
                      <span className="index-topic-count tabular-nums">{topic.links.length}</span>
                    </NextLink>
                  </li>
                ))}
              </ul>
            </nav>
          )}
          {cases.length > 0 && (
            <CommitGraph cases={cases} locale={locale} title={copy.casesTitle} date={copy.date}
              noMatches={copy.noMatches} filterLabels={copy.filters} />
          )}
          <Suspense fallback={null}><BlogIndexInteractions /></Suspense>
        </>
      )}
    </main>
  );
}
