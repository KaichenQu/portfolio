"use client";

import { useTheme } from "@/containers/theme-context";
import React from "react";
import { Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";

export default function ThemeSwitch() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="fixed bottom-5 right-5 z-[999]">
      <motion.button
        onClick={toggleTheme}
        className="bg-white/80 dark:bg-gray-800/80 p-3 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 backdrop-blur-sm hover:scale-110 active:scale-95 transition-all"
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
