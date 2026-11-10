"use client";

import React, { useState } from "react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { ChevronRight, Search } from "lucide-react";
import { mosaic } from "@/components/blog/mosaic";

export type ExplorerGroup = {
  section: string;
  notes: { slug: string; title: string; tags: string[] }[];
};

export default function Explorer({ groups }: { groups: ExplorerGroup[] }) {
  const pathname = usePathname() ?? "";
  const current = pathname.startsWith("/blog/") ? pathname.slice(6) : "";
  const [query, setQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  // Sections the reader toggled; untouched ones open only when they hold the current note.
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const q = query.trim().toLowerCase();
  const filtered = groups
    .map((g) => ({
      ...g,
      notes: q
        ? g.notes.filter(
            (n) =>
              n.title.toLowerCase().includes(q) ||
              n.tags.some((t) => t.toLowerCase().includes(q)),
          )
        : g.notes,
    }))
    .filter((g) => !q || g.notes.length > 0);

  return (
    <nav aria-label="DevLog notes" className="text-[13px]">
      <button
        type="button"
        className="lg:hidden flex w-full items-center justify-between rounded-xl border border-gray-200/70 bg-white/70 px-4 py-2.5 font-medium text-gray-700 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-white/80"
        aria-expanded={mobileOpen}
        onClick={() => setMobileOpen((o) => !o)}
      >
        Browse notes
        <ChevronRight
          className={clsx(
            "h-4 w-4 transition-transform",
            mobileOpen && "rotate-90",
          )}
        />
      </button>

      <div className={clsx("mt-3 lg:mt-0 lg:block", !mobileOpen && "hidden")}>
        <label className="relative block">
          <span className="sr-only">Filter notes by title or tag</span>
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400 dark:text-white/35" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by title or tag"
            className="w-full rounded-lg border border-gray-200/70 bg-white/70 py-1.5 pl-8 pr-2 text-[13px] text-gray-800 placeholder:text-gray-400 focus:border-sky-400 focus:outline-none dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-white/85 dark:placeholder:text-white/30"
          />
        </label>

        {filtered.length === 0 && (
          <p className="mt-4 px-1 text-gray-500 dark:text-white/45">
            No matching notes.
          </p>
        )}

        <ul className="mt-3 space-y-1">
          {filtered.map((g) => {
            const expanded =
              !!q ||
              (open[g.section] ?? g.notes.some((n) => n.slug === current));
            const id = `explorer-${g.section.replace(/\s+/g, "-").toLowerCase()}`;
            return (
              <li key={g.section}>
                <button
                  type="button"
                  aria-expanded={expanded}
                  aria-controls={id}
                  onClick={() =>
                    setOpen((s) => ({ ...s, [g.section]: !expanded }))
                  }
                  className="flex w-full items-center gap-1.5 rounded-md px-1 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-gray-500 hover:text-gray-900 dark:text-white/45 dark:hover:text-white/85"
                >
                  <ChevronRight
                    className={clsx(
                      "h-3.5 w-3.5 transition-transform",
                      expanded && "rotate-90",
                    )}
                  />
                  <span className="flex-1 text-left">{g.section}</span>
                  <span className="tabular-nums">{g.notes.length}</span>
                </button>
                {expanded && (
                  <ul
                    id={id}
                    className="mb-2 ml-[0.55rem] border-l border-gray-200 dark:border-white/[0.08]"
                  >
                    {g.notes.map((n) => (
                      <li key={n.slug}>
                        <NextLink
                          href={`/blog/${n.slug}`}
                          aria-current={n.slug === current ? "page" : undefined}
                          className={clsx(
                            "-ml-px block border-l py-1 pl-3 pr-1 leading-snug transition-colors",
                            n.slug === current
                              ? "border-sky-500 font-medium text-sky-700 dark:border-sky-400 dark:text-sky-300"
                              : "border-transparent text-gray-600 hover:text-gray-900 dark:text-white/60 dark:hover:text-white/90",
                          )}
                        >
                          {mosaic(n.title)}
                        </NextLink>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
