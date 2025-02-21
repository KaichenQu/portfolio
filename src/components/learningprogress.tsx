"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "./ui/card";
import { Progress } from "./ui/progress";
import { cn } from "@/lib/utils";

interface LearningProgressProps {
  name: string;
  description: string;
  progress: number;
}

export default function LearningProgress({
  name,
  description,
  progress,
}: LearningProgressProps) {
  const getProgressText = (progress: number) => {
    if (progress <= 20) return "Just started 🚀";
    if (progress <= 60) return "Getting there 🤔";
    if (progress <= 80) return "Almost 🔥";
    return "Project Finished! 🎉";
  };

  const [isHovered, setIsHovered] = useState(false);
  return (
    <div className="my-4 relative w-full">
      <motion.div
        whileHover={{
          scale: 1.0,
          transition: { duration: 0.5, ease: "easeOut" },
        }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        className="relative overflow-visible group w-full"
      >
        <Card className="w-full p-4 relative bg-gradient-to-br from-white/80 to-white/60 dark:from-gray-900/90 dark:to-gray-800/90 backdrop-blur-md shadow-lg hover:shadow-xl transition-all duration-300">
          <h3 className="font-mono text-xl ml-5">{name}</h3>
          <div className="absolute top-2 right-2 opacity-10 text-sm">
            Hover for more ~
          </div>
          <div className="absolute top-4 left-4 text-3xl opacity-5 z-[-1] pointer-events-none font-mono dark:text-white dark:opacity-10">
            {name}
          </div>

          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{
              opacity: isHovered ? 1 : 0,
              height: isHovered ? "auto" : 0,
            }}
            transition={{
              duration: 0.5,
              ease: "easeInOut",
            }}
            className="overflow-hidden mt-2"
          >
            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
              {description}
            </p>
          </motion.div>

          <div className="mt-4 relative">
            <Progress value={progress} className="h-2">
              <div className="relative">
                <motion.div
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  className="absolute -top-6 text-xs"
                  style={{
                    left: `${progress}%`,
                    transform: "translateX(-50%)",
                  }}
                >
                  <div className="relative">
                    <span className="bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800 px-2 py-1 rounded">
                      {progress}%
                    </span>
                    <div className="w-2 h-2 bg-gray-800 dark:bg-gray-200 transform rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2"></div>
                  </div>
                </motion.div>
              </div>
            </Progress>
            <div className="flex justify-between items-center mt-1 text-xs">
              <span
                className={cn(
                  "transition-colors",
                  progress <= 20 ? "text-blue-500" : "",
                  progress > 20 && progress <= 60 ? "text-amber-500" : "",
                  progress > 60 && progress <= 80 ? "text-orange-500" : "",
                  progress > 80 ? "text-red-500 font-bold" : ""
                )}
              >
                {getProgressText(progress)}
              </span>
              <span>{progress}%</span>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
