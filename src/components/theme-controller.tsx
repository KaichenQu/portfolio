"use client";

import { useTheme } from "@/containers/theme-context";
import React from "react";
import Switch from "./switch";
import { Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";

export default function ThemeSwitch() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="fixed bottom-5 right-5">
      <motion.button
        onClick={toggleTheme}
        className="bg-gray-200 dark:bg-gray-800 p-2 rounded-full"
      >
        <p className="font-semibold">
          {theme === "light" ? <Sun /> : <Moon />}
        </p>
      </motion.button>
    </div>
  );
}
