import NextLink from "next/link";
import { Suspense } from "react";
import { blogPath, noteCount, type BlogLocale } from "@/lib/blog-locale";
import { getNotes, type Note } from "@/lib/devlog";
import { pageMetadata } from "@/lib/seo";
import BlogIndexInteractions from "./blog-index-interactions";
import CommitGraph, { caseKind } from "./commit-graph";
import { LanguageLink, languageAlternates } from "./language-link";
import { mosaic } from "./mosaic";
import { INITIAL_TOPIC_SCRIPT } from "./topic-filter";
import "./blog-index.css";

const OTHER_SECTIONS = ["Techniques", "Lessons", "Glossary", "Cheatsheets"] as const;

type IndexCopy = {
  title: string;
  description: string;
  casesTitle: string;
  topicsLabel: string;
  all: string;
  viewTopic: string;
  empty: string;
  noMatches: string;
  date: string;
  counts: Record<(typeof OTHER_SECTIONS)[number], [singular: string, plural: string]>;
};

const COPY: Record<BlogLocale, IndexCopy> = {
  en: {
    title: "DevLog",
    description:
      "An engineering notebook: how a bug was tracked down step by step, and how architecture and design trade-offs were made.",
    casesTitle: "Cases",
    topicsLabel: "Case topics",
    all: "All",
    viewTopic: "View topic",
    empty: "No notes yet.",
    noMatches: "No matching cases.",
    date: "Date",
    counts: {
      Techniques: ["technique", "techniques"],
      Lessons: ["lesson", "lessons"],
      Glossary: ["term", "terms"],
      Cheatsheets: ["cheatsheet", "cheatsheets"],
    },
  },
  "zh-Hans": {
    title: "工程笔记",
    description: "记录软件故障的排查过程，以及架构和设计中的取舍。",
    casesTitle: "案例",
    topicsLabel: "案例主题",
    all: "全部",
    viewTopic: "查看主题",
    empty: "暂无笔记。",
    noMatches: "没有匹配的案例。",
    date: "日期",
    counts: {
      Techniques: ["项技术", "项技术"],
      Lessons: ["篇教训", "篇教训"],
      Glossary: ["个术语", "个术语"],
      Cheatsheets: ["份速查", "份速查"],
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
  const fallback = locale === "zh-Hans" && notes.length ? getNotes({ locale: "en" }) : [];
  if (fallback.length) {
    const order = new Map(fallback.map(({ slug }, i) => [slug, i]));
    notes.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? "") ||
      (order.get(a.slug) ?? order.size) - (order.get(b.slug) ?? order.size));
  }
  const cases = notes.filter(caseKind);
  const caseTopics = new Map<string, number[]>(cases.map(note => [note.slug, []]));
  const bySlug = new Map([...fallback, ...notes].map(note => [note.slug, note]));
  const indexPath = blogPath(locale);
  const topics = notes.filter(note => note.section === "Maps").map((note, index) => {
    const id = index + 1;
    let count = 0;
    const otherNotes: Note[] = [];
    for (const slug of note.links) {
      const ids = caseTopics.get(slug);
      if (ids) {
        ids.push(id);
        count++;
      }
      const linked = bySlug.get(slug);
      if (linked) otherNotes.push(linked);
    }
    const summary = OTHER_SECTIONS.flatMap(section => {
      const total = otherNotes.filter(linked => linked.section === section).length;
      return total ? [`${total} ${copy.counts[section][total === 1 ? 0 : 1]}`] : [];
    }).join(" · ");
    return { id, slug: note.slug, title: note.title, count, summary, href: blogPath(locale, `/${note.slug}`) };
  });
  const tabs = [{ id: 0, slug: "", title: copy.all, count: cases.length, href: indexPath }, ...topics];
  const topicStyles = topics.map(({ id, count }) => {
    const root = `.blog-index[data-topic="${id}"]`;
    return `${root} [data-case-topics]:not([data-case-topics~="${id}"]) { display: none; }
      ${root} [data-topic-summary="${id}"]${count === 0 ? `, ${root} [data-empty-cases]` : ""} { display: block; }`;
  }).join("\n");

  function topicStrip(fallbackLinks = false) {
    return (
      <nav aria-label={copy.topicsLabel} className="index-topic-strip" data-topic-tabs={fallbackLinks ? undefined : ""}>
        <ul>
          {tabs.map(({ id, slug, title, count, href }) => (
            <li key={id}>
              <NextLink href={fallbackLinks || !slug ? href : `${indexPath}?topic=${encodeURIComponent(slug)}`}
                className="index-topic-tab" scroll={false} prefetch={false}
                data-topic-tab={fallbackLinks ? undefined : id}
                data-topic-slug={fallbackLinks ? undefined : slug}
                aria-current={id === 0 ? "page" : undefined} suppressHydrationWarning>
                <span>{mosaic(title, locale)}</span>{" "}
                <span className="index-topic-count font-mono tabular-nums">{count}</span>
              </NextLink>
            </li>
          ))}
        </ul>
      </nav>
    );
  }

  return (
    <main className="blog-index min-w-0 border" data-blog-index data-topic="0" suppressHydrationWarning>
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
          <CommitGraph cases={cases} caseTopics={caseTopics} locale={locale} title={copy.casesTitle}
            date={copy.date} noMatches={copy.noMatches}>
            {topics.length > 0 && (
              <>
                <style>{topicStyles}</style>
                {topicStrip()}
                <noscript>
                  <style>{".blog-index [data-topic-tabs] { display: none; }"}</style>
                  {topicStrip(true)}
                </noscript>
                <script dangerouslySetInnerHTML={{ __html: INITIAL_TOPIC_SCRIPT }} />
                {topics.map(({ id, title, href, summary }) => (
                  <p className="index-topic-summary" data-topic-summary={id} key={id}>
                    <NextLink href={href} aria-label={`${copy.viewTopic} ${title}`}>{copy.viewTopic}</NextLink>
                    {summary && <> · <span>{summary}</span></>}
                  </p>
                ))}
              </>
            )}
          </CommitGraph>
          <Suspense fallback={null}><BlogIndexInteractions /></Suspense>
        </>
      )}
    </main>
  );
}
