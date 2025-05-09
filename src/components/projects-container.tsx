"use client";

import Timeline from "./timeline";
import Project from "./project-card";
import { projectsData } from "@/lib/data";
import { motion } from "framer-motion";
import { TextShimmerWave } from "./ui/text-shimmer-wave";

export default function ProjectsContainer() {
  return (
    <div className="relative w-full max-w-7xl mx-auto px-4">
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-[1fr,2fr] gap-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="order-1 lg:order-1">
          <div className="flex justify-center mb-8">
            <TextShimmerWave
              className="text-3xl [--base-color:#374151] [--base-gradient-color:#111827] dark:text-white/60"
              duration={1.25}
              spread={0.7}
              zDistance={1}
              scaleDistance={1.1}
              rotateYDistance={20}
            >
              Projects
            </TextShimmerWave>
          </div>
          <div className="space-y-8">
            {projectsData.map((project, index) => (
              <Project key={index} {...project} />
            ))}
          </div>
        </div>
        <div className="order-2 lg:order-2 mt-12 lg:mt-0">
          <div className="flex justify-center mb-8">
            <TextShimmerWave
              className="text-3xl [--base-color:#374151] [--base-gradient-color:#111827] dark:text-white/60"
              duration={1.25}
              spread={0.7}
              zDistance={1}
              scaleDistance={1.1}
              rotateYDistance={20}
            >
              Timeline
            </TextShimmerWave>
          </div>
          <div className="lg:sticky lg:top-24 h-[calc(100vh-6rem)]">
            <Timeline />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
