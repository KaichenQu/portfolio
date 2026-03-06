"use client";

import React from "react";
import Image from "next/image";
import { skillCategories } from "@/lib/skills";
import { TextShimmerWave } from "./ui/text-shimmer-wave";
import { InfiniteSlider } from "./ui/infinite-slider";

// Only icons that map to actual skill cards
const sliderIcons = [
  { src: "/skills-icons/Java-Dark.svg", alt: "Java" },
  { src: "/skills-icons/Spring-Dark.svg", alt: "Spring" },
  { src: "/skills-icons/MySQL-Dark.svg", alt: "MySQL" },
  { src: "/skills-icons/Redis-Dark.svg", alt: "Redis" },
  { src: "/skills-icons/MongoDB.svg", alt: "MongoDB" },
  { src: "/skills-icons/PostgreSQL-Dark.svg", alt: "PostgreSQL" },
  { src: "/skills-icons/Elasticsearch-Dark.svg", alt: "ElasticSearch" },
  { src: "/skills-icons/TypeScript.svg", alt: "TypeScript" },
  { src: "/skills-icons/React-Dark.svg", alt: "React" },
  { src: "/skills-icons/nextjs.jpeg", alt: "Next.js" },
  { src: "/skills-icons/NodeJS-Dark.svg", alt: "Node.js" },
  { src: "/skills-icons/GoLang.svg", alt: "Go" },
  { src: "/skills-icons/rocketmq.png", alt: "RocketMQ" },
  { src: "/skills-icons/zookeeper.png", alt: "Zookeeper" },
  { src: "/skills-icons/Python-Dark.svg", alt: "Python" },
];

function getBarColor(progress: number) {
  if (progress >= 80) return "from-pink-400 to-violet-400";
  if (progress >= 65) return "from-blue-400 to-cyan-400";
  return "from-amber-400 to-orange-300";
}

function SkillCard({
  name,
  description,
  progress,
}: {
  name: string;
  description: string;
  progress: number;
}) {
  return (
    <div className="group p-3.5 rounded-xl border border-gray-200/70 dark:border-white/[0.07] bg-white/40 dark:bg-white/[0.02] hover:bg-white/75 dark:hover:bg-white/[0.05] hover:border-gray-300/80 dark:hover:border-white/[0.12] hover:shadow-sm transition-all duration-200">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[15px] font-semibold text-gray-800 dark:text-white/90 tracking-tight leading-none">
          {name}
        </h3>
        <span className="text-[11px] font-mono tabular-nums text-gray-400 dark:text-white/25 ml-2 flex-shrink-0">
          {progress}%
        </span>
      </div>

      <div className="h-[2px] rounded-full bg-gray-100 dark:bg-white/[0.07] mb-2.5">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${getBarColor(progress)}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="text-xs leading-relaxed text-gray-500 dark:text-white/35 group-hover:text-gray-600 dark:group-hover:text-white/50 transition-colors duration-200">
        {description}
      </p>
    </div>
  );
}

export default function SkillMap() {
  return (
    <div className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto px-4 pb-16">
      <div className="text-center mb-10">
        <TextShimmerWave
          className="text-5xl [--base-color:#374151] [--base-gradient-color:#111827] dark:[--base-color:rgba(255,255,255,0.45)] dark:[--base-gradient-color:#ffffff]"
          duration={1.25}
          spread={0.7}
          zDistance={1}
          scaleDistance={1.1}
          rotateYDistance={20}
        >
          Skill Map
        </TextShimmerWave>
      </div>

      <div className="w-full space-y-6">
        {skillCategories.map((category, categoryIndex) => (
          <div key={categoryIndex}>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-[12px] font-mono font-bold uppercase tracking-[0.14em] text-gray-500 dark:text-white/40 whitespace-nowrap">
                {category.label}
              </span>
              <div className="flex-1 h-px bg-gray-100 dark:bg-white/[0.06]" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {category.skills.map((skill, skillIndex) => (
                <SkillCard key={skillIndex} {...skill} />
              ))}
            </div>
          </div>
        ))}

        {/* Slim icon slider — only relevant tech */}
        <div className="pt-6">
          <InfiniteSlider gap={24} duration={80}>
            {sliderIcons.map((icon, index) => (
              <Image
                key={`${icon.alt}-${index}`}
                src={icon.src}
                alt={icon.alt}
                width={32}
                height={32}
                style={{ width: "auto", height: "32px" }}
                className="opacity-50 dark:opacity-60 hover:opacity-90 dark:brightness-110 transition-all duration-200"
              />
            ))}
          </InfiniteSlider>
        </div>
      </div>
    </div>
  );
}
