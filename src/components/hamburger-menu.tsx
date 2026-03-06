"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "@/lib/types";
import clsx from "clsx";
import NextLink from "next/link";
import { useActiveSectionContext } from "@/containers/active-section";

type HamburgerMenuProps = { links: Link[] };

function MenuIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <div className="w-4 h-3.5 flex flex-col justify-between">
      <motion.span
        className="h-[1.5px] bg-current rounded-full origin-left"
        animate={isOpen ? { rotate: 45, y: -1, x: 2 } : { rotate: 0, y: 0, x: 0 }}
        transition={{ duration: 0.22, ease: "easeInOut" }}
      />
      <motion.span
        className="h-[1.5px] bg-current rounded-full"
        animate={isOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
        transition={{ duration: 0.15 }}
      />
      <motion.span
        className="h-[1.5px] bg-current rounded-full origin-left"
        animate={isOpen ? { rotate: -45, y: 1, x: 2 } : { rotate: 0, y: 0, x: 0 }}
        transition={{ duration: 0.22, ease: "easeInOut" }}
      />
    </div>
  );
}

const HamburgerMenu: React.FC<HamburgerMenuProps> = ({ links }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { activeSection, setActiveSection, setTimeOfLastClick } =
    useActiveSectionContext();

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div
      ref={ref}
      className="md:hidden fixed top-4 right-4 z-[999] flex flex-col items-end gap-2"
    >
      {/* Trigger button */}
      <motion.button
        className="flex items-center justify-center w-9 h-9 rounded-full bg-white/90 dark:bg-gray-950/90 border border-gray-200/60 dark:border-white/[0.09] backdrop-blur-md shadow-sm text-gray-600 dark:text-gray-300"
        onClick={() => setIsOpen((o) => !o)}
        whileTap={{ scale: 0.9 }}
        aria-label={isOpen ? "Close menu" : "Open menu"}
      >
        <MenuIcon isOpen={isOpen} />
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="w-36 bg-white/92 dark:bg-gray-950/92 backdrop-blur-md border border-gray-200/50 dark:border-white/[0.07] rounded-2xl shadow-xl shadow-black/10 dark:shadow-black/40 overflow-hidden"
          >
            {links.map((link, index) => (
              <NextLink
                key={link.hash}
                href={link.hash}
                onClick={() => {
                  setActiveSection(link.hash);
                  setTimeOfLastClick(Date.now());
                  setIsOpen(false);
                }}
                className={clsx(
                  "flex items-center justify-between px-4 py-2.5 text-[0.82rem] font-medium transition-colors",
                  index < links.length - 1 &&
                    "border-b border-gray-100 dark:border-white/[0.05]",
                  activeSection === link.hash
                    ? "text-gray-900 dark:text-white bg-gray-50 dark:bg-white/[0.06]"
                    : "text-gray-400 dark:text-white/40 hover:text-gray-900 dark:hover:text-white/80 hover:bg-gray-50/60 dark:hover:bg-white/[0.03]"
                )}
              >
                {link.nameEng}
                {activeSection === link.hash && (
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-700 dark:bg-white/50 flex-shrink-0" />
                )}
              </NextLink>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HamburgerMenu;
