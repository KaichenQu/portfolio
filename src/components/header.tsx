"use client";

import React from "react";
import { motion } from "framer-motion";
import NextLink from "next/link";
import clsx from "clsx";
import { useActiveSectionContext } from "@/containers/active-section";
import { Link } from "@/lib/types";

type HeaderProps = { links: Link[] };

export default function Header({ links }: HeaderProps) {
  const { activeSection, setActiveSection, setTimeOfLastClick } =
    useActiveSectionContext();

  return (
    <header className="hidden md:flex items-center justify-center fixed z-[999] w-full mt-3">
      <motion.div
        className="flex p-[3px] rounded-full border border-white/40 bg-white/85 shadow-md shadow-black/[0.05] backdrop-blur-[0.5rem] dark:bg-gray-950/80 dark:border-white/[0.08]"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 24 }}
      >
        <ul className="flex items-center gap-0.5 text-[0.8rem] font-medium text-gray-500">
          {links.map((link) => (
            <li className="relative" key={link.hash}>
              <NextLink
                className={clsx(
                  "flex items-center justify-center px-3.5 py-1.5 rounded-full hover:text-gray-900 transition-colors duration-150 dark:text-white/40 dark:hover:text-white/80",
                  { "text-gray-900 dark:text-white/90": activeSection === link.hash }
                )}
                href={link.hash}
                onClick={() => {
                  setActiveSection(link.hash);
                  setTimeOfLastClick(Date.now());
                }}
              >
                {link.nameEng}
                {link.hash === activeSection && (
                  <motion.span
                    className="absolute inset-0 rounded-full bg-gray-100 dark:bg-white/[0.08] -z-10"
                    layoutId="activeSection"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </NextLink>
            </li>
          ))}
        </ul>
      </motion.div>
    </header>
  );
}
