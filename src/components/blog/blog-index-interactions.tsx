"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { CASE_FILTERS, caseMatchSelector, INITIAL_FILTER_STYLE } from "./case-filters";

const MAP_KEYS = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"];

export default function BlogIndexInteractions() {
  const search = useSearchParams()?.toString();
  const syncFilters = useRef<(() => void) | null>(null);

  useEffect(() => {
    const root = document.querySelector<HTMLElement>("[data-blog-index]");
    if (!root) return;
    const map = root.querySelector<HTMLElement>("[data-line-map]");
    const mapLinks = [...root.querySelectorAll<HTMLAnchorElement>("[data-map-link]")];
    const stations = [...root.querySelectorAll<HTMLElement>("[data-map-case]")].map(item => {
      const link = item.querySelector<HTMLAnchorElement>("a")!;
      return { item, link, slug: item.dataset.mapCase!, links: link.dataset.links!.split(" ") };
    });
    const rows = [...root.querySelectorAll<HTMLElement>("[data-case-row]")];
    const filters = [...root.querySelectorAll<HTMLButtonElement>("[data-index-filter]")];
    const empty = root.querySelector<HTMLElement>("[data-empty-cases]");
    const tooltip = map?.querySelector<HTMLElement>("[data-map-tooltip]");
    const tooltipTitle = tooltip?.querySelector<HTMLElement>(".index-map-tooltip-title");
    const date = tooltip?.querySelector<HTMLTimeElement>("time");
    const status = tooltip?.querySelector<HTMLElement>(".index-map-tooltip-meta > span");
    const motion = window.matchMedia?.("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
    let appliedSearch: string | undefined;
    let visibleMapLinks = mapLinks;
    let visibleRows: HTMLAnchorElement[] = [];
    let mapTabStop: HTMLAnchorElement | undefined;
    let hover: HTMLAnchorElement | null = null;
    let focused: HTMLAnchorElement | null = null;
    let active: HTMLAnchorElement | null = null;
    let depth: HTMLElement | null = null;
    let frame = 0;

    function setMapTabStop(link?: HTMLAnchorElement) {
      if (mapTabStop) mapTabStop.tabIndex = -1;
      mapTabStop = link;
      if (link) link.tabIndex = 0;
    }

    function placeTooltip() {
      if (!active || !map || !tooltip) return;
      const anchor = active.getBoundingClientRect();
      const board = map.getBoundingClientRect();
      const rail = active.closest(".index-map-rail")!;
      const railBox = rail.getBoundingClientRect();
      const covers = [...rail.querySelectorAll("[data-map-case]:not([hidden])")];
      const last = covers.at(-1)!.getBoundingClientRect();
      const label = rail.querySelector(".index-map-topic")!.lastElementChild!.getBoundingClientRect();
      const side = Math.max(last.right, label.right) - board.left + 12;
      const inset = railBox.left - board.left;
      if (side + tooltip.offsetWidth <= board.width - inset) {
        tooltip.style.left = `${side}px`;
        tooltip.style.top = `${Math.max(railBox.top, railBox.bottom - tooltip.offsetHeight - 3) - board.top}px`;
      } else {
        tooltip.style.removeProperty("left");
        tooltip.style.setProperty("--tooltip-x", `${anchor.left - board.left + anchor.width / 2}px`);
        tooltip.style.top = `${anchor.bottom - board.top + 6}px`;
      }
    }

    function inspect(link: HTMLAnchorElement | null) {
      const current = stations.find(station => station.link === link && !station.item.hidden);
      const next = current?.link ?? null;
      if (active === next) {
        placeTooltip();
        return;
      }
      active = next;
      map?.toggleAttribute("data-map-active", Boolean(current));
      for (const station of stations) {
        const sameCase = station.slug === current?.slug;
        station.item.toggleAttribute("data-current", station === current);
        station.item.toggleAttribute("data-duplicate", sameCase && station !== current);
        station.item.toggleAttribute("data-related", Boolean(current && (
          sameCase || current.links.includes(station.slug) || station.links.includes(current.slug)
        )));
      }

      if (!tooltip || !tooltipTitle || !date || !status) return;
      tooltip.hidden = !current;
      if (!current) return;
      const title = current.link.querySelector(".index-map-note-title")!;
      tooltipTitle.replaceChildren(...Array.from(title.childNodes, node => node.cloneNode(true)));
      date.textContent = date.dateTime = current.link.dataset.date ?? "";
      date.hidden = !date.dateTime;
      status.textContent = status.dataset.ref = current.item.dataset.status ?? "";
      status.hidden = !status.textContent;
      placeTooltip();
    }

    function sync() {
      const { search } = location;
      if (search === appliedSearch) return;
      appliedSearch = search;
      const params = new URLSearchParams(search);
      for (const filter of filters) {
        const pressed = params.getAll(filter.name).includes(filter.value);
        filter.setAttribute("aria-pressed", String(pressed));
      }
      const selector = caseMatchSelector(search, CASE_FILTERS);
      const matches = (item: HTMLElement) => !selector || item.matches(selector);

      for (const { item } of stations) item.hidden = !matches(item);
      visibleMapLinks = mapLinks.filter(link => !link.closest("[hidden]"));
      setMapTabStop(mapTabStop && visibleMapLinks.includes(mapTabStop) ? mapTabStop : visibleMapLinks[0]);

      visibleRows = [];
      for (const row of rows) {
        row.hidden = !matches(row);
        if (!row.hidden) visibleRows.push(row.firstElementChild as HTMLAnchorElement);
      }
      if (empty) empty.hidden = visibleRows.length > 0;
      inspect(hover ?? focused);
    }

    function toggleFilter(event: MouseEvent) {
      if (!(event.target instanceof Element)) return;
      const filter = event.target.closest<HTMLButtonElement>("[data-index-filter]");
      if (!filter) return;
      const url = new URL(location.href);
      const pressed = filter.getAttribute("aria-pressed") === "true";
      url.searchParams.delete(filter.name);
      for (const button of filters) {
        if (button.name !== filter.name) continue;
        if (button === filter ? !pressed : button.getAttribute("aria-pressed") === "true") {
          url.searchParams.append(button.name, button.value);
        }
      }
      history.pushState(null, "", url);
      sync();
    }

    function mapLinkAt(target: EventTarget | null) {
      return target instanceof Element ? target.closest<HTMLAnchorElement>("[data-map-link]") : null;
    }

    function focusIn(event: FocusEvent) {
      focused = mapLinkAt(event.target);
      if (focused) setMapTabStop(focused);
      hover = null;
      inspect(focused);
    }

    function focusOut(event: FocusEvent) {
      if (!mapLinkAt(event.target)) return;
      focused = null;
      inspect(hover);
    }

    function clearDepth() {
      cancelAnimationFrame(frame);
      depth?.style.removeProperty("--pointer-x");
      depth?.style.removeProperty("--pointer-y");
      depth = null;
    }

    function pointerMove(event: PointerEvent) {
      if (event.pointerType === "touch" || !(event.target instanceof Element)) return;
      const link = mapLinkAt(event.target);
      if (hover !== link) {
        hover = link;
        inspect(hover ?? focused);
      }
      if (!motion?.matches) return;
      const row = event.target.closest<HTMLElement>("[data-case-link]");
      const target = (link ?? row)?.querySelector<HTMLElement>("[data-depth]") ?? null;
      if (target !== depth) clearDepth();
      if (!target) return;
      depth = target;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const { left, top, width, height } = (row ?? target).getBoundingClientRect();
        const unit = (offset: number, size: number) => Math.max(-1, Math.min(1, 2 * offset / size - 1));
        target.style.setProperty("--pointer-x", String(unit(event.clientX - left, width)));
        target.style.setProperty("--pointer-y", String(unit(event.clientY - top, height)));
      });
    }

    function pointerLeave() {
      hover = null;
      inspect(focused);
      clearDepth();
    }

    function moveMapFocus(current: HTMLAnchorElement, key: string) {
      const rail = Number(current.dataset.rail);
      const linksOn = (line: number) => visibleMapLinks.filter(link => Number(link.dataset.rail) === line);
      const line = linksOn(rail);
      const column = line.indexOf(current);
      if (key === "ArrowUp" || key === "ArrowDown") {
        const next = linksOn(rail + (key === "ArrowUp" ? -1 : 1));
        next[Math.min(column, next.length - 1)]?.focus();
      } else {
        const next = key === "Home" ? 0 : key === "End" ? line.length - 1 : column + (key === "ArrowLeft" ? -1 : 1);
        line[next]?.focus();
      }
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
      const link = mapLinkAt(target);
      if (link && MAP_KEYS.includes(event.key)) {
        event.preventDefault();
        moveMapFocus(link, event.key);
        return;
      }
      if (event.key !== "j" && event.key !== "k") return;
      if (target !== document.body && (!(target instanceof Node) || !root!.contains(target))) return;
      const position = visibleRows.indexOf(document.activeElement as HTMLAnchorElement);
      const delta = event.key === "j" ? 1 : -1;
      const next = position < 0 && delta < 0 ? visibleRows.length - 1 : position + delta;
      if (!visibleRows[next]) return;
      event.preventDefault();
      visibleRows[next].focus({ preventScroll: true });
      visibleRows[next].scrollIntoView({ block: "nearest", behavior: "instant" });
    }

    syncFilters.current = sync;
    for (const link of mapLinks) link.tabIndex = -1;
    sync();
    const initialStyle = root.querySelector<HTMLStyleElement>(`#${INITIAL_FILTER_STYLE}`)?.sheet;
    while (initialStyle?.cssRules.length) initialStyle.deleteRule(0);
    for (const filter of filters) filter.disabled = false;
    root.addEventListener("click", toggleFilter);
    root.addEventListener("focusin", focusIn);
    root.addEventListener("focusout", focusOut);
    root.addEventListener("pointermove", pointerMove);
    root.addEventListener("pointerleave", pointerLeave);
    window.addEventListener("keydown", keyDown);
    window.addEventListener("resize", placeTooltip);
    window.addEventListener("popstate", sync);
    return () => {
      root.removeEventListener("click", toggleFilter);
      root.removeEventListener("focusin", focusIn);
      root.removeEventListener("focusout", focusOut);
      root.removeEventListener("pointermove", pointerMove);
      root.removeEventListener("pointerleave", pointerLeave);
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("resize", placeTooltip);
      window.removeEventListener("popstate", sync);
      syncFilters.current = null;
      clearDepth();
    };
  }, []);
  useEffect(() => { syncFilters.current?.(); }, [search]);

  return null;
}
