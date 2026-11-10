import { ImageResponse } from "next/og";
import { getNote, getNotes } from "@/lib/devlog";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "DevLog note";
export const dynamicParams = false;

export function generateStaticParams() {
  return getNotes().map((n) => ({ slug: n.slug }));
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const note = getNote((await params).slug)!;
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px 80px",
        background: "#111827",
        color: "#f9fafb",
      }}
    >
      <div
        style={{
          display: "flex",
          fontSize: 28,
          letterSpacing: 4,
          color: "#38bdf8",
        }}
      >
        {`DEVLOG · ${note.section.toUpperCase()}`}
      </div>
      <div
        style={{
          display: "flex",
          fontSize: note.title.length > 70 ? 54 : 66,
          fontWeight: 700,
          lineHeight: 1.15,
        }}
      >
        {note.title}
      </div>
      <div style={{ display: "flex", fontSize: 28, color: "#9ca3af" }}>
        kelsonqu.com/blog
      </div>
    </div>,
    size,
  );
}
