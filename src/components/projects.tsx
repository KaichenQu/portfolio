"use client";

import React from "react";

import { projectsData } from "@/lib/data";
import Project from "./project-card";
import { useSectionInView } from "@/lib/useInView";
import { TextShimmerWave } from "./ui/text-shimmer-wave";

export default function Projects() {
  const { ref } = useSectionInView("#projects", 0.1);

  return (
    <section ref={ref} id="projects" className="text-center scroll-mt-28 mb-28">
      <TextShimmerWave
        className="text-4xl text-center mb-8 [--base-color:#0D74CE] [--base-gradient-color:#5EB1EF] dark:text-white/60"
        duration={1.25}
        spread={0.7}
        zDistance={1}
        scaleDistance={1.1}
        rotateYDistance={20}
      >
        My Projects...
      </TextShimmerWave>
      <div className=" text-left">
        {projectsData.map((project, index) => (
          <Project {...project} key={index} />
        ))}
      </div>
    </section>
  );
}
