"use client";
import Image from "next/image";
import React from "react";
import { motion } from "framer-motion";
import { Fade } from "react-awesome-reveal";
import Link from "next/link";
import { BsLinkedin } from "react-icons/bs";
import { TextRoll } from "./ui/text-roll";
import { TextEffect } from "./ui/text-effect";

import { Mail } from "lucide-react";
import { useSectionInView } from "@/lib/useInView";
import { useActiveSectionContext } from "@/containers/active-section";
import { GitHubBrandIcon } from "./icons/GitHubBrandIcon";
import { HiOutlineDocumentText } from "react-icons/hi";

export default function Intro() {
  const { ref } = useSectionInView("#home", 0.5);

  return (
    <section
      ref={ref}
      id="home"
      className="mb-28 max-w-[75rem] text-center sm:mb-0 scroll-mt-[100rem]"
    >
      <div className="flex items-center justify-center">
        <div className="relative">
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 150,
              damping: 10,
              duration: 0.2,
            }}
          >
            <Image
              src="/boy.png"
              width={250}
              height={250}
              alt="portrait"
              quality="100"
              priority={true}
              className="rounded-full object-cover shadow-xl"
            />
          </motion.div>
        </div>
      </div>

      <Fade direction="down" delay={20} cascade damping={1} triggerOnce={true}>
        <h1 className="mb-10 mt-4 px-4 text-2xl sm:text-4xl">
          <TextRoll
            className="text-5xl text-zinc-700 dark:text-pink-200 delay-1 repeat-infinite font-bold !leading-[1.5]"
            variants={{
              enter: {
                initial: { rotateX: 0, filter: "blur(0px)" },
                animate: { rotateX: 90, filter: "blur(2px)" },
              },
              exit: {
                initial: { rotateX: 90, filter: "blur(2px)" },
                animate: { rotateX: 0, filter: "blur(0px)" },
              },
            }}
          >
            Kelson's Website
          </TextRoll>
          <TextEffect
            className="text-xl delay-1000"
            per="word"
            as="p"
            preset="blur"
            delay={1.5}
          >
            Resonance is a full-service creative studio creating beautiful
            digital experiences and products.
          </TextEffect>
        </h1>
      </Fade>

      <motion.div
        className="flex sm:flex-row items-center justify-center gap-4 px-4 text-lg font-medium"
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.1,
        }}
      >
        <Link
          href="/contact"
          className="group bg-gray-900 text-white px-6 py-1 flex items-center gap-2 rounded-full outline-none focus:scale-110 hover:scale-110 hover:bg-white hover:text-black dark:bg-white/10 dark:text-white/60 active:scale-105 transition"
        >
          Connect <Mail color={"grey"} />
        </Link>

        <a
          className="bg-gray-900 p-3 text-white flex items-center gap-2 rounded-full focus:scale-[1.4] hover:scale-[1.4] hover:bg-white hover:text-black active:scale-105 transition cursor-pointer borderBlack dark:bg-white/10 dark:text-white/60"
          href="https://www.linkedin.com/in/kelsonqu/"
          target="_blank"
        >
          <BsLinkedin />
        </a>

        <a
          className="bg-gray-900 p-3 text-white flex items-center gap-2 text-[1.35rem] rounded-full focus:scale-[1.4] hover:scale-[1.4] hover:text-black hover:bg-white active:scale-105 transition cursor-pointer borderBlack dark:bg-white/10 dark:text-white/60"
          href="https://github.com/KaichenQu"
          target="_blank"
        >
          <GitHubBrandIcon />
        </a>

        <a
          className="bg-gray-900 p-3 text-white flex items-center gap-2 text-[1.35rem] rounded-full focus:scale-[1.4] hover:scale-[1.4] hover:text-black hover:bg-white active:scale-105 transition cursor-pointer borderBlack dark:bg-white/10 dark:text-white/60"
          href="/KaichenQu-Resume_A.pdf"
          target="_blank"
        >
          <HiOutlineDocumentText />
        </a>
      </motion.div>
    </section>
  );
}
