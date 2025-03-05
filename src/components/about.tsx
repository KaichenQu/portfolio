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
  const { ref } = useSectionInView("/src/app/page.tsx");

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
          className="text-5xl [--base-color:#374151] [--base-gradient-color:#111827] dark:text-white/60"
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
                    <h3 className="font-bold text-2xl bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent inline-block">
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
                      2019 - 2023, I earned my bachelor&apos;s degree from{" "}
                      <span className="font-semibold text-blue-600 dark:text-blue-400">
                        East China University of Science and Technology
                      </span>{" "}
                      <span className="block mt-2">
                        2023 - 2026, I&apos;m now pursuing my master&apos;s
                        degree from{" "}
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                          Northeastern University
                        </span>{" "}
                      </span>
                      <span>
                        My journey has taken me across global tech environments,
                        from leading startup collaborations
                      </span>{" "}
                      to developing innovative software solutions.
                      <span className="italic block mt-2">
                        Passionate about bridging technology and business, I
                        thrive in dynamic and fast-paced settings.
                      </span>
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
                    <h3 className="font-bold text-2xl bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent inline-block">
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
                    <div className="font-mono text-left mt-4 leading-relaxed text-m text-gray-700 dark:text-white/70 group-hover:text-gray-900 dark:group-hover:text-white/90 transition-colors duration-300 space-y-3">
                      <p>
                        As a{" "}
                        <span className="font-semibold text-purple-600 dark:text-purple-400">
                          Full-Stack Developer
                        </span>{" "}
                        with a backend focus, I specialize in{" "}
                        <span className="font-semibold text-purple-600 dark:text-purple-400">
                          Java, Python, and Go
                        </span>
                        .
                      </p>
                      <p>
                        Proficient in popular frameworks like{" "}
                        <span className="font-semibold text-purple-600 dark:text-purple-400">
                          Spring Framework, MyBatis
                        </span>{" "}
                        and experienced with Microservices Architecture.
                      </p>
                      <p>
                        Strong expertise in{" "}
                        <span className="font-semibold text-purple-600 dark:text-purple-400">
                          Distributed Systems, Message Queues (Kafka, RabbitMQ)
                        </span>{" "}
                        and{" "}
                        <span className="font-semibold text-purple-600 dark:text-purple-400">
                          Caching Solutions (Redis)
                        </span>
                        .
                      </p>
                      <p>
                        Experienced with cloud platforms like{" "}
                        <span className="font-semibold text-purple-600 dark:text-purple-400">
                          AWS, Docker, Kubernetes
                        </span>{" "}
                        and CI/CD tools.
                      </p>
                      <p>
                        On the frontend, proficient in{" "}
                        <span className="font-semibold text-purple-600 dark:text-purple-400">
                          React, Next.js, TypeScript
                        </span>{" "}
                        and{" "}
                        <span className="font-semibold text-purple-600 dark:text-purple-400">
                          Tailwind CSS
                        </span>
                        , enabling me to build modern, responsive web
                        applications.
                      </p>
                    </div>
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
