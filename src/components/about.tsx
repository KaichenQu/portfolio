"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import SectionHeading from "./section-heading";
import { Fade } from "react-awesome-reveal";
import { useSectionInView } from "@/lib/useInView";
import LearningProgress from "./learningprogress";
import { skills } from "@/lib/skills";
import { cn } from "@/lib/utils";
import { TextShimmerWave } from "@/components/ui/text-shimmer-wave";
import { useMediaQuery } from "@/lib/useMediaQuery";

export default function About() {
  const { ref } = useSectionInView("#about");
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [selectedSkill, setSelectedSkill] = useState<string>(
    skills[0]?.name || ""
  );

  const getGridColumns = (skillsCount: number) => {
    if (skillsCount <= 4) return "md:grid-cols-1";
    if (skillsCount <= 8) return "md:grid-cols-2";
    if (skillsCount <= 12) return "md:grid-cols-3";
    return "md:grid-cols-4";
  };

  return (
    <motion.section
      className="w-full max-w-[90rem] text-center mt-32 leading-8 mb-28 sm:mb-40 scroll-mt-28 px-4"
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.175 }}
      ref={ref}
      id="about"
    >
      <div className="container mx-auto">
        <TextShimmerWave
          className="text-4xl [--base-color:#0D74CE] [--base-gradient-color:#5EB1EF]"
          duration={1}
          spread={1}
          zDistance={1}
          scaleDistance={1.1}
          rotateYDistance={20}
        >
          About Me...
        </TextShimmerWave>

        <div className="grid xl:grid-cols-2 lg:text-start">
          <div className="flex-1">
            <div className="text-lg mt-12 xl:mt-3">
              <Fade
                direction="up"
                delay={400}
                cascade
                damping={0.1}
                triggerOnce
              >
                <h3 className="font-bold mt-6">Our Mission</h3>
              </Fade>
              <Fade
                direction="up"
                delay={600}
                cascade
                damping={0.1}
                triggerOnce
              >
                <p className="mt-2 leading-relaxed text-sm text-gray-700 dark:text-white/70">
                  We believe that a website is the foundation of a successful
                  online presence...
                </p>
              </Fade>
            </div>
          </div>
          <div>
            <Fade direction="up" delay={1200} cascade damping={0.1} triggerOnce>
              <h3 className="font-bold mt-6 text-center">Skills Map</h3>
            </Fade>
            <motion.section
              className="max-w-[75rem] text-center leading-8 mb-28 sm:mb-40 scroll-mt-28"
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.175 }}
              ref={ref}
              id="about"
            >
              <div className="container mx-auto px-4 w-full">
                {isMobile ? (
                  <select
                    className="w-full border rounded p-2"
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
        </div>
      </div>
    </motion.section>
  );
}
