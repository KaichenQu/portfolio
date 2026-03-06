"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";

import { Fade } from "react-awesome-reveal";
import { useSectionInView } from "@/lib/useInView";
import { TextShimmerWave } from "@/components/ui/text-shimmer-wave";

import {
  Carousel,
  CarouselContent,
  CarouselNavigation,
  CarouselIndicator,
  CarouselItem,
} from "@/components/ui/carousel";

export default function About() {
  const { ref } = useSectionInView("/about");

  return (
    <motion.section
      className="w-full max-w-6xl text-center mt-16 leading-8 mb-16 sm:mb-24 scroll-mt-28 px-4 mx-auto"
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.175 }}
      ref={ref}
      id="about"
    >
      <div className="container mx-auto">
        <TextShimmerWave
          className="text-5xl [--base-color:#374151] [--base-gradient-color:#111827] dark:[--base-color:rgba(255,255,255,0.45)] dark:[--base-gradient-color:#ffffff]"
          duration={1.25}
          spread={0.8}
          zDistance={1}
          scaleDistance={1.05}
          rotateYDistance={10}
        >
          About Me
        </TextShimmerWave>

        <div className="grid xl:grid-cols-2 gap-8 xl:gap-4 items-center">
          <div className="flex-1 order-1 xl:order-1">
            {/* Content */}
            <div className="text-lg mt-12 xl:mt-3">
              <div className="flex justify-start flex-col space-y-8">
                <div className="group">
                  <Fade
                    direction="up"
                    delay={100}
                    cascade
                    damping={1e-1}
                    triggerOnce={true}
                  >
                    <h3 className="font-bold text-2xl bg-gradient-to-r from-blue-500 to-cyan-400 dark:from-blue-400 dark:to-cyan-300 bg-clip-text text-transparent inline-block">
                      My Journey
                    </h3>
                  </Fade>
                  <Fade
                    direction="up"
                    delay={300}
                    cascade
                    damping={1e-1}
                    triggerOnce={true}
                  >
                    <p className="font-mono text-left mt-4 leading-relaxed text-m text-gray-700 dark:text-white/70 group-hover:text-gray-900 dark:group-hover:text-white/90 transition-colors duration-300">
                      B.E. in Energy Engineering at{" "}
                      <span className="font-semibold text-blue-600 dark:text-blue-400">
                        ECUST
                      </span>
                      , then pivoted to CS — now finishing my M.S. at{" "}
                      <span className="font-semibold text-blue-600 dark:text-blue-400">
                        Northeastern University
                      </span>
                      {" "}(Aug 2026). Worked at{" "}
                      <span className="font-semibold text-blue-600 dark:text-blue-400">
                        BMW Group
                      </span>
                      {" "}and{" "}
                      <span className="font-semibold text-blue-600 dark:text-blue-400">
                        Evenness Inc.
                      </span>
                      , building backend systems focused on distributed architecture and high performance.
                    </p>
                  </Fade>
                </div>

                <div className="group">
                  <Fade
                    direction="up"
                    delay={500}
                    cascade
                    damping={1e-1}
                    triggerOnce={true}
                  >
                    <h3 className="font-bold text-2xl bg-gradient-to-r from-purple-500 to-pink-400 dark:from-purple-400 dark:to-pink-300 bg-clip-text text-transparent inline-block">
                      Tech Stack
                    </h3>
                  </Fade>
                  <Fade
                    direction="up"
                    delay={700}
                    cascade
                    damping={1e-1}
                    triggerOnce={true}
                  >
                    <p className="font-mono text-left mt-4 leading-relaxed text-m text-gray-700 dark:text-white/70 group-hover:text-gray-900 dark:group-hover:text-white/90 transition-colors duration-300">
                      Core stack:{" "}
                      <span className="font-semibold text-purple-600 dark:text-purple-400">
                        Java
                      </span>
                      {" "}(Spring Boot, distributed systems) ·{" "}
                      <span className="font-semibold text-purple-600 dark:text-purple-400">
                        TypeScript
                      </span>
                      {" "}(React, Next.js) · Go · Python. Details in Skill Map below.
                    </p>
                  </Fade>
                </div>
              </div>
            </div>
          </div>
          <div className="order-2 xl:order-2 flex justify-center xl:justify-center">
            <div className="relative w-full max-w-xs">
              <Carousel>
                <CarouselContent>
                  <CarouselItem className="p-4">
                    <div className="flex  items-center justify-center border border-zinc-200 dark:border-zinc-800">
                      <Image
                        src="/me/me-1.JPG"
                        alt="About"
                        width={400}
                        height={400}
                        sizes="(max-width: 768px) 90vw, 320px"
                      />
                    </div>
                  </CarouselItem>
                  <CarouselItem className="p-4">
                    <div className="flex  items-center justify-center border border-zinc-200 dark:border-zinc-800">
                      <Image
                        src="/me/me-4.JPG"
                        alt="About"
                        width={400}
                        height={400}
                        sizes="(max-width: 768px) 90vw, 320px"
                      />
                    </div>
                  </CarouselItem>
                  <CarouselItem className="p-4">
                    <div className="flex  items-center justify-center border border-zinc-200 dark:border-zinc-800">
                      <Image
                        src="/me/me-2.JPG"
                        alt="About"
                        width={800}
                        height={450}
                        sizes="(max-width: 768px) 90vw, 320px"
                      />
                    </div>
                  </CarouselItem>
                  <CarouselItem className="p-4">
                    <div className="flex  items-center justify-center border border-zinc-200 dark:border-zinc-800">
                      <Image
                        src="/me/me-3.JPG"
                        alt="About"
                        width={800}
                        height={450}
                        sizes="(max-width: 768px) 90vw, 320px"
                      />
                    </div>
                  </CarouselItem>
                </CarouselContent>
                <CarouselNavigation alwaysShow />
                <CarouselIndicator />
              </Carousel>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
