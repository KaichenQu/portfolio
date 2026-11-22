import { ChevronDown } from "lucide-react";
import NextLink from "next/link";
import { Suspense } from "react";
import { blogPath, noteCount, type BlogLocale } from "@/lib/blog-locale";
import { getNotes } from "@/lib/devlog";
import { pageMetadata } from "@/lib/seo";
import BlogIndexInteractions from "./blog-index-interactions";
import CommitGraph from "./commit-graph";
import { LanguageLink, languageAlternates } from "./language-link";
import LineMap from "./line-map";
import { caseKind } from "./line-map-layout";
import { mosaic } from "./mosaic";
import "./blog-index.css";

const COPY = {
  en: {
    title: "DevLog",
    description:
      "An engineering notebook: how a bug was tracked down step by step, and how architecture and design trade-offs were made.",
    casesTitle: "Cases",
    mapsTitle: "Topic maps",
    empty: "No notes yet.",
    noMatches: "No matching cases.",
    caseName: "Case",
    date: "Date",
    type: "Type",
    status: "Status",
    path: "Path",
    out: "Out",
    in: "In",
    graphNotes: "notes",
    graphLinks: "links",
    all: "All",
    unset: "Unset",
    types: {
      moc: "Topic map", "case-debug": "Debug case", "case-design": "Design case",
      pattern: "Pattern", trick: "Trick", "agent-lesson": "Lesson",
      cheatsheet: "Cheatsheet", glossary: "Glossary term",
    },
    statuses: { solved: "Solved", wip: "WIP", open: "Open" },
  },
  "zh-Hans": {
    title: "工程笔记",
    description: "记录软件故障的排查过程，以及架构和设计中的取舍。",
    casesTitle: "案例",
    mapsTitle: "知识地图",
    empty: "暂无笔记。",
    noMatches: "没有匹配的案例。",
    caseName: "案例",
    date: "日期",
    type: "类型",
    status: "状态",
    path: "路径",
    out: "出链",
    in: "入链",
    graphNotes: "篇笔记",
    graphLinks: "条链接",
    all: "全部",
    unset: "未设置",
    types: {
      moc: "知识地图", "case-debug": "排错案例", "case-design": "设计案例",
      pattern: "模式", trick: "技巧", "agent-lesson": "教训",
      cheatsheet: "速查", glossary: "术语",
    },
    statuses: { solved: "已解决", wip: "进行中", open: "待处理" },
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
  const types = [...new Set(notes.flatMap(({ type }) => type ? [type] : []))].sort();
  const caseTypes = new Set(cases.map(note => note.type));

  return (
    <main className="blog-index min-w-0 border" data-blog-index>
      <header className="flex flex-wrap items-baseline gap-x-4 gap-y-2 border-b px-4 py-3 md:px-5 md:py-4">
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
          <div className="index-filters flex flex-wrap gap-x-4 gap-y-2 border-b px-4 py-2 font-mono text-xs" data-index-filters>
            {[false, true].map(casesOnly => (
              <label key={String(casesOnly)} className={`items-center gap-2 ${casesOnly ? "flex md:hidden" : "hidden md:flex"}`}>
                {copy.type}
                <span className="relative">
                  <select data-index-filter="type" data-case-filter={casesOnly ? "" : undefined} defaultValue="" disabled>
                    <option value="">{copy.all}</option>
                    {types.filter(type => !casesOnly || caseTypes.has(type)).map(type => (
                      <option key={type} value={type}>{copy.types[type as keyof typeof copy.types] ?? type}</option>
                    ))}
                  </select>
                  <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2" />
                </span>
              </label>
            ))}
            <label className="flex items-center gap-2">
              {copy.status}
              <span className="relative">
                <select data-index-filter="status" defaultValue="" disabled>
                  <option value="">{copy.all}</option>
                  {Object.entries(copy.statuses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  <option value="none">{copy.unset}</option>
                </select>
                <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2" />
              </span>
            </label>
          </div>
          <LineMap notes={notes} topics={topics} locale={locale} copy={copy} />
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
              caseName={copy.caseName} noMatches={copy.noMatches} />
          )}
          <Suspense fallback={null}><BlogIndexInteractions /></Suspense>
        </>
      )}
    </main>
  );
}
