import Image from "next/image";
import type { Note } from "@/lib/devlog";

export default function CoverArt({ note, decorative, priority = false, className }: {
  note: Note;
  decorative?: boolean;
  priority?: boolean;
  className?: string;
}) {
  const cover = note.cover;
  if (!cover) return null;
  return (
    <Image
      src={cover.src}
      alt={decorative ? "" : cover.alt ?? note.title}
      width={cover.width}
      height={cover.height}
      className={className}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      unoptimized
    />
  );
}
