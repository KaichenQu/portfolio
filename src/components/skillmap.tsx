"use client";

import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, GripHorizontal } from "lucide-react";
import { skillCategories, skillIcons } from "@/lib/skills";
import LearningProgress from "./learningprogress";
import { TextShimmerWave } from "./ui/text-shimmer-wave";
import { InfiniteSlider } from "./ui/infinite-slider";

export default function SkillMap() {
  const scrollRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [showScrollHints, setShowScrollHints] = useState<boolean[]>(
    new Array(skillCategories.length).fill(true)
  );

  const scroll = (index: number, direction: "left" | "right") => {
    if (scrollRefs.current[index]) {
      const scrollAmount = direction === "left" ? -300 : 300;
      scrollRefs.current[index]?.scrollBy({
        left: scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-7xl mx-auto px-4">
      <div className="text-center mb-8">
        <TextShimmerWave
          className="text-5xl [--base-color:#374151] [--base-gradient-color:#111827] dark:text-white/60"
          duration={1.25}
          spread={0.7}
          zDistance={1}
          scaleDistance={1.1}
          rotateYDistance={20}
        >
          Skill Map
        </TextShimmerWave>
      </div>

      <div className="w-full space-y-8">
        {skillCategories.map((category, categoryIndex) => (
          <div key={categoryIndex} className="relative min-h-[220px]">
            {/* Scroll Hint */}
            {showScrollHints[categoryIndex] && (
              <div className="absolute -top-8 right-0 flex items-center gap-2 text-gray-500 dark:text-gray-400 animate-pulse">
                <GripHorizontal className="w-5 h-5" />
                <span className="text-sm">Scroll to see more</span>
              </div>
            )}

            {/* Navigation Buttons */}
            <button
              onClick={() => scroll(categoryIndex, "left")}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => scroll(categoryIndex, "right")}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Skills Container */}
            <div
              ref={(el) => {
                scrollRefs.current[categoryIndex] = el;
              }}
              className="overflow-x-auto scrollbar-hide"
              onScroll={() => {
                const newHints = [...showScrollHints];
                newHints[categoryIndex] = false;
                setShowScrollHints(newHints);
              }}
            >
              <div className="flex gap-4 pb-4 min-w-max">
                {category.skills.map((skill, skillIndex) => (
                  <div key={skillIndex} className="w-[300px] flex-shrink-0">
                    <LearningProgress
                      name={skill.name}
                      description={skill.description}
                      progress={skill.progress}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
        <div className="flex flex-col gap-2 mt-4">
          <InfiniteSlider gap={24} duration={80}>
            {skillIcons.map((icon, index) => (
              <img
                key={index}
                src={icon.src}
                alt={icon.alt}
                className="h-[60px] w-auto dark:invert"
              />
            ))}
          </InfiniteSlider>
        </div>
      </div>
    </div>
  );
}
