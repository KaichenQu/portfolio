import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LanguageLink, languageAlternates } from "@/components/blog/language-link";
import { NoteList } from "@/components/blog/note-list";
import { blogPath, noteCount, type BlogLocale } from "@/lib/blog-locale";
import { getNotes, getTags } from "@/lib/devlog";
import { pageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ tag: string }> };

// Each published tag has two landing pages, even when one edition has no notes for it.
export function tagParams() {
  return [...new Set([...getTags(), ...getTags({ locale: "zh-Hans" })].map(({ tag }) => tag))]
    .map((tag) => ({ tag }));
}

export async function tagMetadata({ params }: Props, locale: BlogLocale): Promise<Metadata> {
  const { tag } = await params;
  const zh = locale === "zh-Hans";
  const suffix = `/tags/${encodeURIComponent(tag)}`;
  const metadata = pageMetadata(
    blogPath(locale, suffix),
    zh ? `标签 #${tag}` : `#${tag}`,
    zh ? `带有 #${tag} 标签的工程笔记。` : `DevLog notes tagged ${tag}.`,
    { type: "website", locale: zh ? "zh_CN" : "en_US" },
  );
  return {
    ...metadata,
    alternates: { ...metadata.alternates, languages: languageAlternates(suffix) },
  };
}

export default async function TagPage({ params, locale }: Props & { locale: BlogLocale }) {
  const { tag } = await params;
  const zh = locale === "zh-Hans";
  const notes = getNotes({ locale }).filter((n) => n.tags.includes(tag));
  if (notes.length === 0 && !getTags({ locale: zh ? "en" : "zh-Hans" }).some((t) => t.tag === tag))
    notFound();

  return (
    <main>
      <h1 className="text-[2rem] font-bold tracking-[-0.02em] text-gray-950 dark:text-white">
        #{tag}
      </h1>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 font-mono text-[12px] text-gray-500 dark:text-white/45">
        <span>{noteCount(notes.length, locale)}</span>
        <LanguageLink locale={locale} suffix={`/tags/${encodeURIComponent(tag)}`} />
      </div>
      <div className="mt-6">
        {notes.length > 0 ? <NoteList notes={notes} locale={locale} /> : (
          <p className="text-gray-500 dark:text-white/50">
            {zh ? "此标签下暂无中文笔记。" : "No English notes with this tag yet."}
          </p>
        )}
      </div>
    </main>
  );
}
