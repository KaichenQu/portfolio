"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

const MAP_KEYS = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"];

export default function BlogIndexInteractions() {
  const search = useSearchParams()?.toString();
  const syncFilters = useRef<(() => void) | null>(null);

  useEffect(() => {
    const root = document.querySelector<HTMLElement>("[data-blog-index]");
    if (!root) return;
    const stations = [...root.querySelectorAll<HTMLAnchorElement>("[data-station]")];
    const paths = [...root.querySelectorAll<SVGPathElement>("[data-from][data-to]")];
    const rows = [...root.querySelectorAll<HTMLElement>("[data-case-row]")];
    const controls = root.querySelector<HTMLElement>("[data-index-filters]")!;
    const filters = [...controls.querySelectorAll<HTMLSelectElement>("select")];
    const [mapType, caseType, status] = filters;
    const empty = root.querySelector<HTMLElement>("[data-empty-cases]");
    const tooltip = root.querySelector<HTMLElement>("[data-map-tooltip]")!;
    const idle = root.querySelector<HTMLElement>("[data-map-idle]")!;
    const detail = root.querySelector<HTMLElement>("[data-map-detail]")!;
    const fields = [...detail.querySelectorAll<HTMLElement>("[data-map-value]")];
    const byId = new Map(stations.map(node => [node.dataset.station!, node]));
    const motion = window.matchMedia?.("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
    const desktop = window.matchMedia?.("(min-width: 768px)");
    let appliedSearch: string | undefined;
    let appliedDesktop: boolean | undefined;
    let visibleStations = stations;
    let visibleRows: HTMLAnchorElement[] = [];
    let mapTabStop: HTMLAnchorElement | undefined;
    let hover: HTMLAnchorElement | null = null;
    let focused: HTMLAnchorElement | null = null;
    let active: HTMLAnchorElement | null = null;
    let depth: HTMLElement | null = null;
    let frame = 0;

    function setMapTabStop(station?: HTMLAnchorElement) {
      if (mapTabStop) mapTabStop.tabIndex = -1;
      mapTabStop = station;
      if (station) station.tabIndex = 0;
    }

    function inspect(station: HTMLAnchorElement | null, force = false) {
      if (station?.hasAttribute("data-filtered")) station = null;
      if (active === station && !force) return;
      active = station;
      root!.toggleAttribute("data-map-active", Boolean(station));
      const id = station?.dataset.station;
      const neighbours = new Set<string>();
      for (const path of paths) {
        const from = path.dataset.from!;
        const to = path.dataset.to!;
        const visible = !byId.get(from)!.hasAttribute("data-filtered") &&
          !byId.get(to)!.hasAttribute("data-filtered");
        const related = visible && (from === id || to === id);
        path.toggleAttribute("data-filtered", !visible);
        path.toggleAttribute("data-related", related);
        if (related) neighbours.add(from === id ? to : from);
      }
      for (const item of stations) {
        item.toggleAttribute("data-current", item === station);
        item.toggleAttribute("data-related", neighbours.has(item.dataset.station!));
      }
      tooltip.hidden = !station || station.hasAttribute("data-topic");
      if (station && !tooltip.hidden) {
        const title = station.querySelector(".index-station-title")!;
        tooltip.replaceChildren(...Array.from(title.childNodes, node => node.cloneNode(true)));
        tooltip.style.left = station.style.left;
        tooltip.style.top = station.style.top;
        tooltip.dataset.side = station.dataset.labelSide ?? "";
      }
      idle.hidden = Boolean(station);
      detail.hidden = !station;
      if (station) {
        for (const field of fields) {
          const value = station.dataset[field.dataset.mapValue!] || "—";
          field.textContent = value;
          if (field.dataset.mapValue === "path") field.title = value;
          if (field.dataset.mapValue === "status") field.dataset.ref = value;
        }
      }
    }

    function sync() {
      const { search } = location;
      const showMap = desktop?.matches ?? true;
      if (search === appliedSearch && showMap === appliedDesktop) return;
      appliedSearch = search;
      appliedDesktop = showMap;
      const params = new URLSearchParams(search);
      for (const filter of filters) {
        const value = params.get(filter.dataset.indexFilter!) ?? "";
        filter.value = [...filter.options].some(option => option.value === value) ? value : "";
      }
      const type = showMap ? mapType : caseType;
      const matches = ({ dataset }: HTMLElement) =>
        (!type.value || dataset.type === type.value) &&
        (!status.value || (dataset.status ?? "none") === status.value);

      visibleStations = stations.filter(station => {
        const show = matches(station);
        station.toggleAttribute("data-filtered", !show);
        if (show) station.removeAttribute("aria-hidden");
        else station.setAttribute("aria-hidden", "true");
        station.tabIndex = -1;
        return show;
      });
      setMapTabStop(visibleStations.find(station => station === mapTabStop) ??
        visibleStations.find(station => station.hasAttribute("data-topic")) ?? visibleStations[0]);

      visibleRows = [];
      for (const row of rows) {
        const show = matches(row);
        row.hidden = !show;
        row.toggleAttribute("data-lead", show && visibleRows.length === 0);
        if (show) visibleRows.push(row.firstElementChild as HTMLAnchorElement);
      }
      if (empty) empty.hidden = visibleRows.length > 0;
      inspect(hover ?? focused, true);
    }

    function change(event: Event) {
      const filter = filters.find(filter => filter === event.target);
      if (!filter) return;
      const url = new URL(location.href);
      const key = filter.dataset.indexFilter!;
      if (filter.value) url.searchParams.set(key, filter.value);
      else url.searchParams.delete(key);
      if (url.href !== location.href) history.pushState(null, "", url);
      sync();
    }

    function stationAt(target: EventTarget | null) {
      return target instanceof Element ? target.closest<HTMLAnchorElement>("[data-station]") : null;
    }

    function focusIn(event: FocusEvent) {
      focused = stationAt(event.target);
      if (focused) setMapTabStop(focused);
      hover = null;
      inspect(focused);
    }

    function focusOut(event: FocusEvent) {
      if (!stationAt(event.target)) return;
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
      const station = stationAt(event.target);
      if (hover !== station) {
        hover = station;
        inspect(hover ?? focused);
      }
      if (!motion?.matches) return;
      const row = event.target.closest<HTMLElement>("[data-case-link]");
      const target = (station ?? row)?.querySelector<HTMLElement>("[data-depth]") ?? null;
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

    function moveStation(current: HTMLAnchorElement, key: string) {
      const rail = Number(current.dataset.rail);
      const x = Number(current.dataset.x);
      const order = (a: HTMLAnchorElement, b: HTMLAnchorElement) => Number(a.dataset.x) - Number(b.dataset.x);
      if (key === "ArrowUp" || key === "ArrowDown") {
        const direction = key === "ArrowUp" ? -1 : 1;
        const candidates = visibleStations.filter(node => (Number(node.dataset.rail) - rail) * direction > 0);
        candidates.sort((a, b) => direction * (Number(a.dataset.rail) - Number(b.dataset.rail)) ||
          Math.abs(Number(a.dataset.x) - x) - Math.abs(Number(b.dataset.x) - x) || order(a, b));
        candidates[0]?.focus();
      } else {
        const line = visibleStations.filter(node => Number(node.dataset.rail) === rail).sort(order);
        const index = line.indexOf(current);
        const next = key === "Home" ? 0 : key === "End" ? line.length - 1 : index + (key === "ArrowLeft" ? -1 : 1);
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
      const station = stationAt(target);
      if (station && MAP_KEYS.includes(event.key)) {
        event.preventDefault();
        moveStation(station, event.key);
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
    for (const filter of filters) filter.disabled = false;
    root.addEventListener("change", change);
    root.addEventListener("focusin", focusIn);
    root.addEventListener("focusout", focusOut);
    root.addEventListener("pointermove", pointerMove);
    root.addEventListener("pointerleave", pointerLeave);
    window.addEventListener("keydown", keyDown);
    desktop?.addEventListener("change", sync);
    return () => {
      root.removeEventListener("change", change);
      root.removeEventListener("focusin", focusIn);
      root.removeEventListener("focusout", focusOut);
      root.removeEventListener("pointermove", pointerMove);
      root.removeEventListener("pointerleave", pointerLeave);
      window.removeEventListener("keydown", keyDown);
      desktop?.removeEventListener("change", sync);
      syncFilters.current = null;
      clearDepth();
    };
  }, []);
  useEffect(() => { syncFilters.current?.(); }, [search]);

  return null;
}
