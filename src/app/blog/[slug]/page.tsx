import type { Metadata } from "next";
import NextLink from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import Mermaid from "@/components/blog/mermaid";
import { StatusBadge, TagList } from "@/components/blog/note-list";
import { getBacklinks, getNote, getNotes, renderNote } from "@/lib/devlog";
import { pageMetadata, SITE_URL } from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return getNotes().map((n) => ({ slug: n.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const note = getNote((await params).slug);
  if (!note) return {};
  // Explicit images outrank this segment's opengraph-image file, so name it here.
  return pageMetadata(
    `/blog/${note.slug}`,
    note.title,
    note.description,
    { type: "article", publishedTime: note.date, tags: note.tags },
    {
      url: `/blog/${note.slug}/opengraph-image`,
      width: 1200,
      height: 630,
      alt: note.title,
    },
  );
}

export default async function NotePage({ params }: Props) {
  const note = getNote((await params).slug);
  if (!note) notFound();
  const { html, toc, hasMermaid } = await renderNote(note);
  const backlinks = getBacklinks(note.slug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: note.title,
    description: note.description,
    ...(note.date && { datePublished: note.date }),
    keywords: note.tags.join(", "),
    url: `${SITE_URL}/blog/${note.slug}`,
    author: {
      "@type": "Person",
      "@id": `${SITE_URL}/#person`,
      name: "Kelson Qu",
      url: SITE_URL,
    },
  };

  return (
    <main className="xl:grid xl:grid-cols-[minmax(0,1fr)_13rem] xl:gap-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <article className="min-w-0">
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-1 font-mono text-[12px] text-gray-500 dark:text-white/45"
        >
          <NextLink
            href="/blog"
            className="hover:text-gray-900 dark:hover:text-white/85"
          >
            DevLog
          </NextLink>
          <ChevronRight className="h-3 w-3" />
          <span>{note.section}</span>
        </nav>

        <h1 className="mt-3 text-[1.9rem] font-bold leading-tight tracking-[-0.02em] text-gray-950 sm:text-[2.25rem] dark:text-white">
          {note.title}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 font-mono text-[12px] text-gray-500 dark:text-white/50">
          {note.date && <time dateTime={note.date}>{note.date}</time>}
          <span>{note.readingMinutes} min read</span>
          <StatusBadge status={note.status} />
        </div>
        <div className="mt-3">
          <TagList tags={note.tags} />
        </div>

        <div
          id="note-body"
          className="prose prose-gray mt-8 max-w-none dark:prose-invert prose-headings:scroll-mt-24 prose-headings:tracking-[-0.01em] prose-a:text-sky-700 prose-a:decoration-sky-400/40 prose-a:underline-offset-2 hover:prose-a:decoration-sky-500 dark:prose-a:text-sky-300 prose-code:font-mono prose-code:before:content-none prose-code:after:content-none prose-pre:border prose-pre:border-gray-200 dark:prose-pre:border-white/10 prose-img:rounded-lg"
          dangerouslySetInnerHTML={{ __html: html }}
        />
        {hasMermaid && <Mermaid />}
      </article>

      {(toc.length > 0 || backlinks.length > 0) && (
        <aside className="mt-12 space-y-8 border-t border-gray-200 pt-8 text-[13px] xl:mt-0 xl:border-t-0 xl:pt-0 dark:border-white/10">
          <div className="space-y-8 xl:sticky xl:top-24 xl:max-h-[calc(100vh-11rem)] xl:overflow-y-auto scrollbar-hide">
            {toc.length > 0 && (
              <nav aria-labelledby="toc-title">
                <h2
                  id="toc-title"
                  className="font-mono text-[11px] uppercase tracking-[0.14em] text-gray-500 dark:text-white/45"
                >
                  On this page
                </h2>
                <ul className="mt-2 space-y-1.5">
                  {toc.map((t) => (
                    <li
                      key={t.id}
                      className={t.depth === 3 ? "pl-3" : undefined}
                    >
                      <a
                        href={`#${t.id}`}
                        className="leading-snug text-gray-600 hover:text-sky-700 dark:text-white/60 dark:hover:text-sky-300"
                      >
                        {t.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
            {backlinks.length > 0 && (
              <nav aria-labelledby="backlinks-title">
                <h2
                  id="backlinks-title"
                  className="font-mono text-[11px] uppercase tracking-[0.14em] text-gray-500 dark:text-white/45"
                >
                  Backlinks
                </h2>
                <ul className="mt-2 space-y-1.5">
                  {backlinks.map((b) => (
                    <li key={b.slug}>
                      <NextLink
                        href={`/blog/${b.slug}`}
                        className="leading-snug text-gray-600 hover:text-sky-700 dark:text-white/60 dark:hover:text-sky-300"
                      >
                        {b.title}
                      </NextLink>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
          </div>
        </aside>
      )}
    </main>
  );
}
