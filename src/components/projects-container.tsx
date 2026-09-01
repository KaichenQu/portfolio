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
        className="grid grid-cols-1 lg:grid-cols-[3fr,2fr] gap-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="order-1 lg:order-1">
          <div className="flex justify-center mb-8">
            <TextShimmerWave
              as="h1"
              className="text-3xl [--base-color:#374151] [--base-gradient-color:#111827] dark:[--base-color:rgba(255,255,255,0.45)] dark:[--base-gradient-color:#ffffff]"
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
            {projectsData.map((project) => (
              <Project key={project.title} {...project} />
            ))}
          </div>
        </div>
        <div className="order-2 lg:order-2 mt-12 lg:mt-0">
          <div className="flex justify-center mb-8">
            <TextShimmerWave
              as="h2"
              className="text-3xl [--base-color:#374151] [--base-gradient-color:#111827] dark:[--base-color:rgba(255,255,255,0.45)] dark:[--base-gradient-color:#ffffff]"
              duration={1.25}
              spread={0.7}
              zDistance={1}
              scaleDistance={1.1}
              rotateYDistance={20}
            >
              Timeline
            </TextShimmerWave>
          </div>
          {/* Height leaves ~2rem slack under top-24 so the footer can't push the
              stuck panel up under the fixed nav pill at page end. */}
          <div className="lg:sticky lg:top-24 lg:h-[calc(100vh-8rem)] lg:overflow-y-auto">
            <Timeline />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
