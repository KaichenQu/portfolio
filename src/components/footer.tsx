"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Clock } from "./timer";

export default function Footer() {
  const pathname = usePathname();
  if (pathname === "/") return null;
  return (
    <footer className="relative z-10 w-full mt-auto py-5 px-6 text-center text-[12px] text-gray-500 dark:text-white/45">
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
        <span>
          &copy; {new Date().getFullYear()} Kelson Qu. Built with{" "}
          <a
            href="https://nextjs.org"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-700 dark:hover:text-white/80 underline-offset-2 hover:underline transition-colors"
          >
            Next.js
          </a>{" "}
          &amp;{" "}
          <a
            href="https://tailwindcss.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-700 dark:hover:text-white/80 underline-offset-2 hover:underline transition-colors"
          >
            Tailwind
          </a>
          .
        </span>
        <span className="hidden sm:inline text-gray-300 dark:text-white/15">·</span>
        <span className="inline-flex items-center gap-1.5 font-mono">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
          <Clock />
        </span>
      </div>
    </footer>
  );
}
