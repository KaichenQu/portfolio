import Image from "next/image";
import type { Note } from "@/lib/devlog";

export default function CoverArt({ note, priority = false }: { note: Note; priority?: boolean }) {
  const cover = note.cover;
  if (!cover) return null;
  return (
    <Image
      src={cover.kind === "art" ? `/blog/art/${note.slug}` : cover.src}
      alt=""
      width={cover.width}
      height={cover.height}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      unoptimized
    />
  );
}
