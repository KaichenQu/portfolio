"use client";

import { useEffect } from "react";
import { useTheme } from "@/containers/theme-context";

let seq = 0;

/** Renders every `.mermaid` block inside `#note-body`; mounted only on pages that have one. */
export default function Mermaid() {
  const { theme } = useTheme();

  useEffect(() => {
    let cancelled = false;
    const blocks = Array.from(
      document.querySelectorAll<HTMLElement>("#note-body .mermaid"),
    );
    import("mermaid").then(async ({ default: mermaid }) => {
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: "strict",
        theme: theme === "dark" ? "dark" : "default",
        fontFamily: "var(--font-sans), sans-serif",
        // Natural width: a wide diagram scrolls inside its card instead of shrinking.
        flowchart: { useMaxWidth: false },
        sequence: { useMaxWidth: false },
        state: { useMaxWidth: false },
        class: { useMaxWidth: false },
        er: { useMaxWidth: false },
        gantt: { useMaxWidth: false },
      });
      for (const el of blocks) {
        el.dataset.source ??= el.textContent ?? "";
        try {
          const { svg } = await mermaid.render(
            `mermaid-${++seq}`,
            el.dataset.source,
          );
          if (cancelled) return;
          el.innerHTML = svg;
          el.dataset.rendered = "true";
        } catch {
          // Leave the source visible when a diagram fails to parse.
          el.textContent = el.dataset.source;
        }
      }
    });
    return () => {
      cancelled = true;
    };
  }, [theme]);

  return null;
}
