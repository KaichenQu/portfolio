"use client";

import { useTheme } from "@/containers/theme-context";
import React from "react";
import { Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";

export default function ThemeSwitch() {
  const { theme, toggleTheme } = useTheme();

  return (
    // Mobile: top-right beside the hamburger (right-4 + w-9 + gap), so it never
    // sits on the footer or hero text. Desktop: bottom-right corner.
    <div className="fixed top-4 right-[3.75rem] md:top-auto md:right-5 md:bottom-5 z-[999]">
      <motion.button
        type="button"
        onClick={toggleTheme}
        aria-label={
          theme === "light" ? "Switch to dark theme" : "Switch to light theme"
        }
        className="bg-white/80 dark:bg-gray-800/80 p-1.5 md:p-3 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 backdrop-blur-sm hover:scale-110 active:scale-95 transition-all"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        {theme === "light" ? (
          <Sun className="w-6 h-6" />
        ) : (
          <Moon className="w-6 h-6" />
        )}
      </motion.button>
    </div>
  );
}
