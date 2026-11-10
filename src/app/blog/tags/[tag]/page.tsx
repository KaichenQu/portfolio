import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NoteList } from "@/components/blog/note-list";
import { getNotes, getTags } from "@/lib/devlog";
import { pageMetadata } from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return getTags().map(({ tag }) => ({ tag }));
}

type Props = { params: Promise<{ tag: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag } = await params;
  return pageMetadata(
    `/blog/tags/${tag}`,
    `#${tag}`,
    `DevLog notes tagged ${tag}.`,
  );
}

export default async function TagPage({ params }: Props) {
  const { tag } = await params;
  const notes = getNotes().filter((n) => n.tags.includes(tag));
  if (notes.length === 0) notFound();

  return (
    <main>
      <h1 className="text-[2rem] font-bold tracking-[-0.02em] text-gray-950 dark:text-white">
        #{tag}
      </h1>
      <p className="mt-2 font-mono text-[12px] text-gray-500 dark:text-white/45">
        {notes.length} {notes.length === 1 ? "note" : "notes"}
      </p>
      <div className="mt-6">
        <NoteList notes={notes} />
      </div>
    </main>
  );
}
