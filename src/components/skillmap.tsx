"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";

import { Fade } from "react-awesome-reveal";
import { useSectionInView } from "@/lib/useInView";
import LearningProgress from "./learningprogress";
import { skills } from "@/lib/skills";
import { cn } from "@/lib/utils";
import { TextShimmerWave } from "@/components/ui/text-shimmer-wave";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { InfiniteSlider } from "@/components/ui/infinite-slider";
import { Divide } from "lucide-react";

export default function SkillMap() {
  const { ref } = useSectionInView("#skills");
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [selectedSkill, setSelectedSkill] = useState<string>(
    skills[0]?.name || ""
  );

  const getGridColumns = (skillsCount: number) => {
    if (skillsCount <= 3) return "md:grid-cols-1";
    if (skillsCount <= 6) return "md:grid-cols-2";
    if (skillsCount <= 9) return "md:grid-cols-3";
    return "md:grid-cols-4";
  };

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div className="w-full max-w-7xl mx-auto px-4">
        <div className="text-center mb-8">
          <TextShimmerWave
            className="text-5xl [--base-color:#374151] [--base-gradient-color:#111827] dark:text-white/60"
            duration={1.25}
            spread={0.7}
            zDistance={1}
            scaleDistance={1.1}
            rotateYDistance={20}
          >
            Skill Map...
          </TextShimmerWave>
        </div>
        <motion.section
          className="w-full mb-16 sm:mb-20 scroll-mt-28"
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.175 }}
          ref={ref}
          id="skills"
        >
          <div className="container mx-auto px-4 w-full">
            {isMobile ? (
              <select
                className="w-full border rounded p-2 dark:bg-gray-800 dark:text-white"
                value={selectedSkill}
                onChange={(e) => setSelectedSkill(e.target.value)}
              >
                {skills.map((skill) => (
                  <option key={skill.name} value={skill.name}>
                    {skill.name}
                  </option>
                ))}
              </select>
            ) : (
              <div
                className={cn(
                  "grid gap-6",
                  "grid-cols-1",
                  getGridColumns(skills.length)
                )}
              >
                {skills.map((skill, index) => (
                  <div key={index} className="transition-all duration-300">
                    <LearningProgress
                      name={skill.name}
                      description={skill.description}
                      progress={skill.progress}
                    />
                  </div>
                ))}
              </div>
            )}

            {isMobile && (
              <div className="mt-4">
                {skills.find((skill) => skill.name === selectedSkill) && (
                  <LearningProgress
                    name={selectedSkill}
                    description={
                      skills.find((skill) => skill.name === selectedSkill)
                        ?.description || ""
                    }
                    progress={
                      skills.find((skill) => skill.name === selectedSkill)
                        ?.progress || 0
                    }
                  />
                )}
              </div>
            )}
          </div>
        </motion.section>
      </div>
      <div className="flex flex-col gap-2 mt-4">
        <InfiniteSlider gap={24} duration={80}>
          <img
            src="/skills-icons/Java-Dark.svg"
            alt="Java"
            className="h-[60px] w-auto dark:invert"
          />
          <img
            src="/skills-icons/Python-Dark.svg"
            alt="Python"
            className="h-[60px] w-auto dark:invert"
          />
          <img
            src="/skills-icons/Golang.svg"
            alt="Go"
            className="h-[60px] w-auto dark:invert"
          />
          <img
            src="/skills-icons/React-Dark.svg"
            alt="React"
            className="h-[60px] w-auto dark:invert"
          />
          <img
            src="/skills-icons/TypeScript.svg"
            alt="TypeScript"
            className="h-[60px] w-auto dark:invert"
          />
          <img
            src="/skills-icons/MySQL-Dark.svg"
            alt="MySQL"
            className="h-[60px] w-auto dark:invert"
          />
          <img
            src="/skills-icons/Redis-Dark.svg"
            alt="Redis"
            className="h-[60px] w-auto dark:invert"
          />
          <img
            src="/skills-icons/MongoDB.svg"
            alt="MongoDB"
            className="h-[60px] w-auto dark:invert"
          />
          <img
            src="/skills-icons/PostgreSQL-Dark.svg"
            alt="PostgreSQL"
            className="h-[60px] w-auto dark:invert"
          />
          <img
            src="/skills-icons/RabbitMQ-Dark.svg"
            alt="RabbitMQ"
            className="h-[60px] w-auto dark:invert"
          />
          <img
            src="/skills-icons/RocketMQ.png"
            alt="RocketMQ"
            className="h-[60px] w-auto dark:invert"
          />
          <img
            src="/skills-icons/Zookeeper.png"
            alt="Zookeeper"
            className="h-[60px] w-auto dark:invert"
          />
          <img
            src="/skills-icons/Kubernetes.svg"
            alt="Kubernetes"
            className="h-[60px] w-auto dark:invert"
          />
          <img
            src="/skills-icons/Docker.svg"
            alt="Docker"
            className="h-[60px] w-auto dark:invert"
          />
          <img
            src="/skills-icons/AWS-Dark.svg"
            alt="AWS"
            className="h-[60px] w-auto dark:invert"
          />
          <img
            src="/skills-icons/GCP-Dark.svg"
            alt="GCP"
            className="h-[60px] w-auto dark:invert"
          />
          <img
            src="/skills-icons/Git.svg"
            alt="Git"
            className="h-[60px] w-auto dark:invert"
          />
          <img
            src="/skills-icons/Jenkins-Dark.svg"
            alt="Jenkins"
            className="h-[60px] w-auto dark:invert"
          />
        </InfiniteSlider>
      </div>
    </div>
  );
}
