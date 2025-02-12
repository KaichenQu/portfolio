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
          className="text-4xl [--base-color:#0D74CE] [--base-gradient-color:#5EB1EF] dark:text-white/60"
          duration={1.25}
          spread={0.7}
          zDistance={1}
          scaleDistance={1.1}
          rotateYDistance={20}
        >
          About Me...
        </TextShimmerWave>

        <div className="grid xl:grid-cols-2 lg:text-start">
          <div className="flex-1">
            {/* Content */}
            <div className="text-lg mt-12 xl:mt-3">
              <div className="flex justify-start flex-col">
                <Fade
                  direction="up"
                  delay={400}
                  cascade
                  damping={1e-1}
                  triggerOnce={true}
                >
                  <h3 className="font-bold mt-6">Our Mission</h3>
                </Fade>
                <Fade
                  direction="up"
                  delay={600}
                  cascade
                  damping={1e-1}
                  triggerOnce={true}
                >
                  <p className="mt-2 leading-relaxed text-sm text-gray-700 dark:text-white/70">
                    We believe that a website is the foundation of a successful
                    online presence, and our goal is to help businesses
                    establish a strong digital presence. Our process begins with
                    understanding your business goals.
                  </p>
                </Fade>
                <Fade
                  direction="up"
                  delay={800}
                  cascade
                  damping={1e-1}
                  triggerOnce={true}
                >
                  <h3 className="font-bold mt-6">Our Vision</h3>
                </Fade>
                <Fade
                  direction="up"
                  delay={1000}
                  cascade
                  damping={1e-1}
                  triggerOnce={true}
                >
                  <p className="mt-2 leading-relaxed text-sm text-gray-700 dark:text-white/70">
                    We then use this information to create a custom website that
                    not only reflects your brand but also helps you achieve your
                    business objectives. From responsive design to intuitive
                    navigation, we focus on every detail.
                  </p>
                </Fade>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
