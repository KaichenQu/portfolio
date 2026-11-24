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
    const motion = window.matchMedia?.("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
    let depth: HTMLElement | null = null;
    let frame = 0;

    function clearDepth() {
      cancelAnimationFrame(frame);
      depth?.style.removeProperty("--pointer-x");
      depth?.style.removeProperty("--pointer-y");
      depth = null;
    }

    function pointerMove(event: PointerEvent) {
      if (event.pointerType === "touch" || !(event.target instanceof Element)) return;
      if (!motion?.matches) return;
      const row = event.target.closest<HTMLElement>("[data-case-link]");
      const target = row?.querySelector<HTMLElement>("[data-depth]") ?? null;
      if (target !== depth) clearDepth();
      if (!row || !target) return;
      depth = target;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const { left, top, width, height } = row.getBoundingClientRect();
        const unit = (offset: number, size: number) => Math.max(-1, Math.min(1, 2 * offset / size - 1));
        target.style.setProperty("--pointer-x", String(unit(event.clientX - left, width)));
        target.style.setProperty("--pointer-y", String(unit(event.clientY - top, height)));
      });
    }

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

    root.addEventListener("pointermove", pointerMove);
    root.addEventListener("pointerleave", clearDepth);
    window.addEventListener("keydown", keyDown);
    return () => {
      root.removeEventListener("pointermove", pointerMove);
      root.removeEventListener("pointerleave", clearDepth);
      window.removeEventListener("keydown", keyDown);
      clearDepth();
    };
  }, []);

  return null;
}
