"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  AnimatePresence,
} from "framer-motion";

const DOT_VIS = 22;
type EventType = "education" | "work" | "current";

// ── Dynamic date boundaries ──────────────────────────────────────────────────
const TL_START = new Date(2019, 8, 1); // Sep 1 2019
const TL_TODAY = new Date();
const TL_END = new Date(TL_TODAY.getFullYear() + 1, 11, 31); // Dec 31 next year
const TOTAL_MS = TL_END.getTime() - TL_START.getTime();
const END_YEAR = TL_TODAY.getFullYear() + 1;

const toPct = (d: Date) =>
  Math.max(0, Math.min(100, ((d.getTime() - TL_START.getTime()) / TOTAL_MS) * 100));

const TODAY_PCT = toPct(TL_TODAY); // e.g. ~79% for Mar 2026 → Dec 2027

function pctToDateStr(pct: number): string {
  const ms = TL_START.getTime() + (pct / 100) * TOTAL_MS;
  return new Date(ms).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

// ── Events ───────────────────────────────────────────────────────────────────
// ECUST and NEU extend to cover the full track (no gaps)
const EVENTS = [
  {
    id: "ecust",
    pct: toPct(new Date(2019, 8, 1)),
    endPct: toPct(new Date(2023, 8, 1)), // Sep 2023 (NEU start)
    dateLabel: "Sep 2019 – Aug 2023",
    title: "East China Univ. of Science and Technology",
    subtitle: "B.E. · Energy & Power Engineering · Shanghai",
    type: "education" as EventType,
  },
  {
    id: "cdp",
    pct: toPct(new Date(2021, 6, 1)),
    endPct: toPct(new Date(2021, 9, 1)),
    dateLabel: "Jul 2021 – Oct 2021",
    title: "CDP Group",
    subtitle: "R&D Engineer Intern · Shanghai, China",
    type: "work" as EventType,
  },
  {
    id: "bmw",
    pct: toPct(new Date(2022, 6, 1)),
    endPct: toPct(new Date(2023, 4, 30)),
    dateLabel: "Jul 2022 – May 2023",
    title: "BMW Group",
    subtitle: "R&D Engineer Intern · Shanghai, China",
    type: "work" as EventType,
  },
  {
    id: "neu",
    pct: toPct(new Date(2023, 8, 1)),
    endPct: 100, // covers rest of track
    dateLabel: "Sep 2023 – Aug 2026",
    title: "Northeastern University",
    subtitle: "M.S. · Computer Science · GPA 3.9/4.0",
    type: "education" as EventType,
  },
  {
    id: "evenness",
    pct: toPct(new Date(2025, 6, 1)),
    endPct: toPct(new Date(2025, 11, 31)),
    dateLabel: "Jul 2025 – Dec 2025",
    title: "Evenness Inc.",
    subtitle: "Backend Engineer Intern · Cupertino, CA",
    type: "work" as EventType,
  },
  {
    id: "now",
    pct: TODAY_PCT,
    endPct: 100,
    dateLabel: "Mar 2026 – Present",
    title: "Northeastern University",
    subtitle: "Expected graduation Aug 2026 · Open to full-time roles",
    type: "current" as EventType,
  },
];

// ── Styles ────────────────────────────────────────────────────────────────────
const DOT_CLS: Record<EventType, string> = {
  education:
    "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.7)] ring-2 ring-red-200 dark:ring-red-900",
  work: "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)] ring-2 ring-blue-200 dark:ring-blue-900",
  current:
    "bg-yellow-400 shadow-[0_0_14px_rgba(250,204,21,1),0_0_28px_rgba(250,204,21,0.5)] ring-2 ring-yellow-200 dark:ring-yellow-800",
};
const DATE_CLS: Record<EventType, string> = {
  education: "text-red-500 dark:text-red-400",
  work: "text-blue-500 dark:text-blue-400",
  current: "text-yellow-500 dark:text-yellow-400",
};
const CARD_BORDER: Record<EventType, string> = {
  education: "border-red-100 dark:border-red-500/15",
  work: "border-blue-100 dark:border-blue-500/15",
  current: "border-yellow-100 dark:border-yellow-400/20",
};
const DOT_MINI: Record<EventType, string> = {
  education: "bg-red-500",
  work: "bg-blue-500",
  current: "bg-yellow-400",
};

function getActive(pct: number) {
  const active = EVENTS.filter((ev) => pct >= ev.pct && pct <= ev.endPct);
  if (active.length > 0) return active;
  // Fallback: nearest event (shouldn't happen with current ranges)
  return [EVENTS.reduce((best, ev) =>
    Math.abs(ev.pct - pct) < Math.abs(best.pct - pct) ? ev : best
  )];
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function TimelineHorizontal() {
  const trackRef = useRef<HTMLDivElement>(null);
  const trackWRef = useRef(0);
  const currentPctRef = useRef(TODAY_PCT);
  const isDraggingRef = useRef(false);

  const [isDragging, setIsDragging] = useState(false);
  const [currentPct, setCurrentPct] = useState(TODAY_PCT);

  const dotCenter = useMotionValue(0);
  const dotLeft = useTransform(dotCenter, (v) => v - DOT_VIS / 2);

  // Keep ref in sync
  useEffect(() => {
    currentPctRef.current = currentPct;
  }, [currentPct]);

  // Init + resize
  useEffect(() => {
    const update = () => {
      if (!trackRef.current) return;
      const w = trackRef.current.offsetWidth;
      trackWRef.current = w;
      dotCenter.set(w * (currentPctRef.current / 100));
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [dotCenter]);

  const posFromClient = useCallback((clientX: number) => {
    if (!trackRef.current) return null;
    const rect = trackRef.current.getBoundingClientRect();
    const w = trackWRef.current;
    const maxCenter = w * (TODAY_PCT / 100); // cannot drag past today
    const center = Math.max(0, Math.min(maxCenter, clientX - rect.left));
    return { center, pct: (center / w) * 100 };
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      isDraggingRef.current = true;
      setIsDragging(true);
      const pos = posFromClient(e.clientX);
      if (!pos) return;
      dotCenter.set(pos.center);
      setCurrentPct(pos.pct);
    },
    [dotCenter, posFromClient]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDraggingRef.current) return;
      const pos = posFromClient(e.clientX);
      if (!pos) return;
      dotCenter.set(pos.center);
      setCurrentPct(pos.pct);
    },
    [dotCenter, posFromClient]
  );

  const handlePointerUp = useCallback(() => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);
    // No snap — dot stays where released
  }, []);

  const activeEvents = getActive(currentPct);
  const primaryType = (activeEvents.at(-1)?.type ?? "current") as EventType;
  const isAtNow = !isDragging && Math.abs(currentPct - TODAY_PCT) < 1.5;

  return (
    <div className="w-full select-none">
      {/* Header */}
      <div className="flex items-center gap-3 mb-10">
        <span className="text-sm font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-white/40 font-mono whitespace-nowrap">
          2019 — Now
        </span>
        <div className="flex-1 h-px bg-gray-100 dark:bg-white/[0.06]" />
        <span className="text-[11px] font-mono text-gray-300 dark:text-white/20 whitespace-nowrap">
          drag to explore
        </span>
      </div>

      {/* Drag zone — py-5 expands hit area vertically */}
      <div
        className="relative touch-none py-5 cursor-grab active:cursor-grabbing"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div
          ref={trackRef}
          className="relative h-2 rounded-full bg-gray-100 dark:bg-white/[0.07]"
        >
          {/* Gradient fill: FIXED at today's position — future is gray */}
          <div
            className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-blue-500 via-violet-500 to-pink-500"
            style={{ width: `${TODAY_PCT}%` }}
          />

          {/* Draggable dot — pointer-events-none, moved via motion value */}
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 pointer-events-none z-10"
            style={{ left: dotLeft, width: DOT_VIS, height: DOT_VIS }}
          >
            {isAtNow ? (
              <motion.div
                className={`w-full h-full rounded-full ${DOT_CLS.current}`}
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
            ) : (
              <motion.div
                key={primaryType}
                className={`w-full h-full rounded-full ${DOT_CLS[primaryType]}`}
                initial={{ scale: 0.7 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              />
            )}
          </motion.div>
        </div>
      </div>

      {/* Year labels + floating date */}
      <div className="relative flex justify-between -mt-3 mb-8 items-center h-5">
        <span className="text-sm font-mono font-medium text-gray-400 dark:text-white/30">
          2019
        </span>
        <AnimatePresence>
          {isDragging && (
            <motion.span
              className="absolute text-[11px] font-mono text-gray-400 dark:text-white/30 whitespace-nowrap pointer-events-none"
              style={{
                left: `clamp(2rem, ${currentPct}%, calc(100% - 2rem))`,
                transform: "translateX(-50%)",
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
            >
              {pctToDateStr(currentPct)}
            </motion.span>
          )}
        </AnimatePresence>
        <span className="text-sm font-mono font-medium text-gray-400 dark:text-white/30">
          {END_YEAR}
        </span>
      </div>

      {/* Event info — fixed-height panel, content crossfades inside, no layout shift */}
      <div className="relative h-[10rem] rounded-2xl border border-gray-100 dark:border-white/[0.07] bg-white/60 dark:bg-white/[0.03] backdrop-blur-sm overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeEvents.map((e) => e.id).join("-")}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute inset-0 flex flex-col justify-center gap-3 px-5 py-4"
          >
            {activeEvents.map((ev, i) => (
              <div key={ev.id}>
                {i > 0 && (
                  <div className="h-px bg-gray-100 dark:bg-white/[0.06] mb-3" />
                )}
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-[3px] flex-shrink-0 w-2 h-2 rounded-full ${DOT_MINI[ev.type]} shadow-sm`}
                  />
                  <div className="min-w-0">
                    <p className={`text-xs font-mono font-semibold mb-0.5 ${DATE_CLS[ev.type]}`}>
                      {ev.dateLabel}
                    </p>
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-white/85 leading-tight">
                      {ev.title}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-white/40 mt-0.5">
                      {ev.subtitle}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
