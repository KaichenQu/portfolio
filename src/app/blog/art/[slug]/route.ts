import { readFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { COVERS_DIR, getNote, getNotes } from "@/lib/devlog";
import { cutOutPaper } from "@/components/blog/cover-cutout";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  const slugs = new Set(
    [...getNotes(), ...getNotes({ locale: "zh-Hans" })]
      .filter(({ cover }) => cover?.kind === "art")
      .map(({ slug }) => slug),
  );
  return [...slugs].map(slug => ({ slug }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cover = (getNote(slug) ?? getNote(slug, { locale: "zh-Hans" }))?.cover;
  if (cover?.kind !== "art") return new Response(null, { status: 404 });

  const source = await readFile(join(COVERS_DIR, basename(cover.src)));
  const art = await cutOutPaper(source);
  return new Response(new Uint8Array(art), {
    headers: { "Content-Type": "image/webp", "Cache-Control": "public, max-age=86400" },
  });
}
