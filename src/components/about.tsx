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
                      My journey began at{" "}
                      <span className="font-semibold text-blue-600 dark:text-blue-400">
                        East China University of Science and Technology
                      </span>
                      , where I earned my bachelor&apos;s in Energy and Power Engineering. Driven by my passion for software development, I transitioned to{" "}
                      <span className="font-semibold text-blue-600 dark:text-blue-400">
                        Computer Science
                      </span>
                      {" "}and am now pursuing my master&apos;s at{" "}
                      <span className="font-semibold text-blue-600 dark:text-blue-400">
                        Northeastern University in San Jose
                      </span>
                      .

                      <span className="block mt-2">
                        My professional experience spans from{" "}
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                          BMW Group
                        </span>
                        {" "}and{" "}
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                          CDP Group
                        </span>
                        {" "}to current research at{" "}
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                          MIG Lab
                        </span>
                        . At BMW, I developed{" "}
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                          PyQt-based testing frameworks
                        </span>
                        ; at CDP, I built{" "}
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                          web apps and WeChat mini programs
                        </span>
                        ; and at MIG Lab, I focus on{" "}
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                          deep learning for medical imaging
                        </span>
                        .
                      </span>

                      <span className="block mt-2">
                        I&apos;ve led several significant projects, including a{" "}
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                          high-performance SaaS platform
                        </span>
                        {" "}with{" "}
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                          RocketMQ
                        </span>
                        , a{" "}
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                          distributed RPC framework
                        </span>
                        {" "}using{" "}
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                          Netty
                        </span>
                        , and a{" "}
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                          career fair system
                        </span>
                        {" "}with{" "}
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                          Django and Next.js
                        </span>
                        . I also developed{" "}
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                          LiteKV
                        </span>
                        , a high-performance key-value store in{" "}
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                          Go
                        </span>
                        .
                      </span>

                      <span className="italic block mt-2">
                        I thrive in dynamic environments that combine engineering excellence with innovative solutions, focusing on high performance and reliability.
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
                        </span>
                        , I specialize in{" "}
                        <span className="font-semibold text-purple-600 dark:text-purple-400">
                          Java, Python, Go, and TypeScript
                        </span>
                        {" "}for building scalable systems.
                      </p>
                      <p>
                        Backend expertise includes{" "}
                        <span className="font-semibold text-purple-600 dark:text-purple-400">
                          Spring Boot, Django, and gRPC
                        </span>
                        {" "}for microservices, along with{" "}
                        <span className="font-semibold text-purple-600 dark:text-purple-400">
                          RocketMQ, Netty, and Zookeeper
                        </span>
                        {" "}for distributed systems.
                      </p>
                      <p>
                        Frontend development with{" "}
                        <span className="font-semibold text-purple-600 dark:text-purple-400">
                          React, Next.js, and Redux
                        </span>
                        {" "}for modern web applications, backed by{" "}
                        <span className="font-semibold text-purple-600 dark:text-purple-400">
                          MySQL, MongoDB, and Redis
                        </span>
                        {" "}for data management.
                      </p>
                      <p>
                        Cloud and DevOps experience with{" "}
                        <span className="font-semibold text-purple-600 dark:text-purple-400">
                          AWS, GCP, Docker, and Kubernetes
                        </span>
                        {" "}for deployment and scaling, plus{" "}
                        <span className="font-semibold text-purple-600 dark:text-purple-400">
                          PyTorch and TensorFlow
                        </span>
                        {" "}for AI/ML research.
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
