"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";

type Entry = {
  id: string;
  date: string;
  title: string;
  subtitle: string;
  badge?: string;
  badgeBg?: string;
  badgeColor?: string;
  meta?: string;
  type: "education" | "work" | "current";
  dot: string;
  href?: string;
};

// Reverse-chronological order: most recent first
const ENTRIES: Entry[] = [
  {
    id: "now",
    date: "Now",
    title: "Northeastern University",
    subtitle: "Expected graduation Aug 2026",
    type: "current",
    dot: "bg-yellow-400 ring-2 ring-yellow-200 dark:ring-yellow-800 shadow-[0_0_8px_rgba(250,204,21,0.9),0_0_16px_rgba(250,204,21,0.4)]",
    href: "https://www.northeastern.edu/",
  },
  {
    id: "evenness",
    date: "Jul 2025",
    title: "Evenness Inc.",
    subtitle: "Backend Engineer Intern",
    meta: "Jul 2025 – Dec 2025 · Cupertino, CA",
    type: "work",
    dot: "bg-blue-500 ring-2 ring-blue-200 dark:ring-blue-900 shadow-[0_0_6px_rgba(59,130,246,0.5)]",
    badgeBg: "rgba(59,130,246,0.1)",
    badgeColor: "#3B82F6",
    href: "https://www.evenness.rocks/",
  },
  {
    id: "neu",
    date: "Sep 2023",
    title: "Northeastern University",
    subtitle: "M.S. · Computer Science",
    badge: "GPA 3.9 / 4.0",
    badgeBg: "rgba(239,68,68,0.1)",
    badgeColor: "#EF4444",
    meta: "Sep 2023 – Aug 2026 · San Jose, CA",
    type: "education",
    dot: "bg-red-500 ring-2 ring-red-200 dark:ring-red-900 shadow-[0_0_6px_rgba(239,68,68,0.6)]",
    href: "https://www.northeastern.edu/",
  },
  {
    id: "bmw",
    date: "Jul 2022",
    title: "BMW Group",
    subtitle: "R&D Engineer Intern",
    meta: "Jul 2022 – May 2023 · Shanghai, China",
    type: "work",
    dot: "bg-blue-500 ring-2 ring-blue-200 dark:ring-blue-900 shadow-[0_0_6px_rgba(59,130,246,0.5)]",
    badgeBg: "rgba(59,130,246,0.1)",
    badgeColor: "#3B82F6",
    href: "https://www.bmwgroup.com/",
  },
  {
    id: "cdp",
    date: "Jul 2021",
    title: "CDP Group",
    subtitle: "R&D Engineer Intern",
    meta: "Jul 2021 – Oct 2021 · Shanghai, China",
    type: "work",
    dot: "bg-blue-500 ring-2 ring-blue-200 dark:ring-blue-900 shadow-[0_0_6px_rgba(59,130,246,0.5)]",
    badgeBg: "rgba(59,130,246,0.1)",
    badgeColor: "#3B82F6",
    href: "https://www.cdpgroupltd.com/",
  },
  {
    id: "ecust",
    date: "Sep 2019",
    title: "East China Univ. of Science and Technology",
    subtitle: "B.E. · Energy & Power Engineering",
    badge: "GPA 3.6 / 4.0",
    badgeBg: "rgba(239,68,68,0.1)",
    badgeColor: "#EF4444",
    meta: "Sep 2019 – Aug 2023 · Shanghai, China",
    type: "education",
    dot: "bg-red-500 ring-2 ring-red-200 dark:ring-red-900 shadow-[0_0_6px_rgba(239,68,68,0.6)]",
    href: "https://www.ecust.edu.cn/en/",
  },
];

export default function Timeline() {
  return (
    <div className="w-full">
      {/* Legend */}
      <div className="flex items-center gap-5 mb-5 px-2">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.6)]" />
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Education
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_5px_rgba(59,130,246,0.5)]" />
          <span className="text-xs text-gray-500 dark:text-gray-400">Work</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 shadow-[0_0_5px_rgba(250,204,21,0.8)]" />
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Current
          </span>
        </div>
      </div>

      {ENTRIES.map((entry, i) => {
        const isLast = i === ENTRIES.length - 1;
        return (
          <motion.div
            key={entry.id}
            className={cn(
              "flex gap-x-3 relative group rounded-lg -mx-2 px-2 transition-colors duration-200",
              entry.href && "hover:bg-gray-50 dark:hover:bg-gray-800/50",
            )}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: i * 0.09 }}
          >
            {/* Full-card clickable overlay (Preline pattern) */}
            {entry.href && (
              <a
                href={entry.href}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute inset-0 z-10 rounded-lg"
                aria-label={`Visit ${entry.title}`}
              />
            )}

            {/* Left column: dot + connecting line */}
            <div className="relative flex flex-col items-center w-8 flex-shrink-0">
              <div className="h-8 w-8 flex items-center justify-center">
                {entry.type === "current" ? (
                  <motion.div
                    className={cn("w-3.5 h-3.5 rounded-full", entry.dot)}
                    animate={{ scale: [1, 1.25, 1] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                ) : (
                  <div className={cn("w-3.5 h-3.5 rounded-full", entry.dot)} />
                )}
              </div>
              {!isLast && (
                <div
                  className="absolute w-px bg-gray-200 dark:bg-gray-700"
                  style={{ top: 32, bottom: 0 }}
                />
              )}
            </div>

            {/* Right column: content */}
            <div
              className={cn("flex-1 min-w-0 pt-1", isLast ? "pb-2" : "pb-8")}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="text-xs text-gray-400 dark:text-gray-500 font-mono leading-none">
                  {entry.date}
                </p>
                {entry.href && (
                  <ArrowUpRight className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 group-hover:text-blue-400 transition-colors flex-shrink-0" />
                )}
              </div>
              <h3
                className={cn(
                  "font-semibold leading-tight text-gray-800 dark:text-gray-100",
                  entry.type !== "work" ? "text-[15px]" : "text-sm",
                )}
              >
                {entry.title}
              </h3>
              <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
                {entry.subtitle}
              </p>
              {entry.badge && (
                <span
                  className="inline-block text-[11px] px-1.5 py-0.5 rounded mt-1.5 font-mono"
                  style={{
                    backgroundColor: entry.badgeBg,
                    color: entry.badgeColor,
                  }}
                >
                  {entry.badge}
                </span>
              )}
              {entry.meta && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 font-mono tabular-nums">
                  {entry.meta}
                </p>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
