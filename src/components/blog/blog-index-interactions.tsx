"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useLayoutEffect } from "react";
import { syncTopicFilter } from "./topic-filter";

export default function BlogIndexInteractions() {
  const search = useSearchParams()?.toString() ?? "";

  useLayoutEffect(() => {
    syncTopicFilter(document.querySelector("[data-blog-index]"), search);
  }, [search]);

  useEffect(() => {
    const root = document.querySelector<HTMLElement>("[data-blog-index]");
    if (!root) return;
    const rows = [...root.querySelectorAll<HTMLAnchorElement>("[data-case-link]")];

    function keyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
      const target = event.target;
      if (target instanceof HTMLElement && (target.isContentEditable || target.closest("input, select, textarea, button"))) return;
      if (event.key === "/") {
        const filter = document.querySelector<HTMLInputElement>('aside nav input[type="search"]');
        if (!filter) return;
        event.preventDefault();
        if (!filter.getClientRects().length)
          filter.closest("nav")?.querySelector<HTMLButtonElement>(':scope > button[aria-expanded="false"]')?.click();
        requestAnimationFrame(() => filter.focus());
        return;
      }
      if (event.shiftKey) return;
      if (event.key !== "j" && event.key !== "k") return;
      if (target !== document.body && (!(target instanceof Node) || !root!.contains(target))) return;
      const visibleRows = rows.filter(row => row.getClientRects().length);
      const position = visibleRows.indexOf(document.activeElement as HTMLAnchorElement);
      const delta = event.key === "j" ? 1 : -1;
      const next = position < 0 && delta < 0 ? visibleRows.length - 1 : position + delta;
      if (!visibleRows[next]) return;
      event.preventDefault();
      visibleRows[next].focus({ preventScroll: true });
      visibleRows[next].scrollIntoView({ block: "nearest", behavior: "instant" });
    }

    window.addEventListener("keydown", keyDown);
    return () => window.removeEventListener("keydown", keyDown);
  }, []);

  return null;
}
