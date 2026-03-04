"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export default function PostsPreview() {
  return (
    <section className="w-full">
      {/* Section header */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-gray-400 dark:text-white/30 font-mono">
          Recent Writing
        </h2>
        <Link
          href="/blog"
          className="text-xs text-gray-400 dark:text-white/30 hover:text-gray-700 dark:hover:text-white/70 transition-colors flex items-center gap-1"
        >
          View all <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Empty state */}
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        {/* Three dots */}
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-200 dark:bg-white/10" />
          <span className="w-1.5 h-1.5 rounded-full bg-gray-200 dark:bg-white/10" />
          <span className="w-1.5 h-1.5 rounded-full bg-gray-200 dark:bg-white/10" />
        </div>
        <p className="text-sm text-gray-400 dark:text-white/25 font-mono">
          Nothing here yet.
        </p>
        <p className="text-xs text-gray-300 dark:text-white/15">
          Working on it — check back soon.
        </p>
      </div>
    </section>
  );
}
