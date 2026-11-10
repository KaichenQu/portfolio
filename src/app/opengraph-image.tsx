import { ImageResponse } from "next/og";
import { JOB_TITLE } from "@/lib/seo";

export const alt = "Kelson Qu, Full-Stack & AI Engineer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 96px",
          background: "#111827",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ width: 96, height: 6, background: "#38bdf8", marginBottom: 40 }} />
        <div style={{ fontSize: 120, fontWeight: 700, letterSpacing: -2 }}>Kelson Qu</div>
        <div style={{ fontSize: 48, color: "#38bdf8", marginTop: 16 }}>{JOB_TITLE}</div>
        <div style={{ fontSize: 32, color: "#9ca3af", marginTop: 64 }}>kelsonqu.com</div>
      </div>
    ),
    size,
  );
}
