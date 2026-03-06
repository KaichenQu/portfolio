"use client";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { BsLinkedin } from "react-icons/bs";
import { TextEffect } from "./ui/text-effect";
import { Mail } from "lucide-react";
import { useSectionInView } from "@/lib/useInView";
import { GitHubBrandIcon } from "./icons/GitHubBrandIcon";
import { HiOutlineDocumentText } from "react-icons/hi";

export default function Intro() {
  const { ref } = useSectionInView("/", 0.5);
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/resume")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.filename) setResumeUrl(`/resume/${data.filename}`);
      })
      .catch(() => {});
  }, []);

  return (
    <section
      ref={ref}
      id="home"
      className="mb-28 max-w-[75rem] text-center sm:mb-0 scroll-mt-[100rem]"
    >
      {/* Avatar */}
      <div className="flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 150, damping: 10 }}
        >
          <Image
            src="/boy.png"
            width={250}
            height={250}
            alt="portrait"
            quality={100}
            priority={true}
            className="rounded-full object-cover shadow-xl"
          />
        </motion.div>
      </div>

      {/* Heading */}
      <motion.div
        className="mt-6 mb-8 px-4"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
      >
        <h1 className="text-4xl sm:text-5xl font-bold text-zinc-800 dark:text-white/90 leading-tight">
          Kelson Qu
        </h1>
        <p className="mt-2 text-base text-gray-500 dark:text-white/40 font-mono">
          Full-Stack Developer · M.S. CS @ Northeastern
        </p>
        <TextEffect
          className="mt-3 text-lg text-gray-600 dark:text-white/55"
          per="word"
          as="p"
          preset="blur"
          delay={0.6}
        >
          Ship fast. Scale further. Break nothing.
        </TextEffect>
      </motion.div>

      {/* Buttons */}
      <motion.div
        className="flex items-center justify-center gap-2.5 px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
      >
        {/* GitHub — brand: charcoal → hover white+charcoal icon */}
        <div className="group relative flex flex-col items-center">
          <a
            className="bg-[#24292e] p-3 text-white text-[1.2rem] rounded-full flex items-center justify-center hover:scale-110 hover:bg-white hover:text-[#24292e] hover:ring-1 hover:ring-gray-200 dark:bg-[#24292e] dark:hover:bg-white dark:hover:text-[#24292e] active:scale-100 transition-all duration-150"
            href="https://github.com/KaichenQu"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub profile"
          >
            <GitHubBrandIcon />
          </a>
          <span className="absolute top-full mt-2 text-[13px] font-mono text-gray-500 dark:text-white/40 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 pointer-events-none select-none">
            GitHub
          </span>
        </div>

        {/* LinkedIn — brand blue → hover white+blue icon */}
        <div className="group relative flex flex-col items-center">
          <a
            className="bg-[#0A66C2] p-3 text-white rounded-full flex items-center justify-center hover:scale-110 hover:bg-white hover:text-[#0A66C2] hover:ring-1 hover:ring-blue-200 dark:bg-[#0A66C2]/85 dark:hover:bg-white dark:hover:text-[#0A66C2] active:scale-100 transition-all duration-150"
            href="https://www.linkedin.com/in/kelsonqu/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn profile"
          >
            <BsLinkedin />
          </a>
          <span className="absolute top-full mt-2 text-[13px] font-mono text-gray-500 dark:text-white/40 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 pointer-events-none select-none">
            LinkedIn
          </span>
        </div>

        <div className="w-px h-5 bg-gray-200/60 dark:bg-white/10 mx-0.5" />

        {/* Resume — violet → hover white+violet icon */}
        <div className="group relative flex flex-col items-center">
          <button
            className="bg-violet-600 p-3 text-white text-[1.15rem] rounded-full flex items-center justify-center hover:scale-110 hover:bg-white hover:text-violet-600 hover:ring-1 hover:ring-violet-200 dark:bg-violet-700 dark:hover:bg-white dark:hover:text-violet-600 active:scale-100 transition-all duration-150 outline-none"
            aria-label="View resume"
            onClick={() => {
              const url = resumeUrl ?? "/resume/KaichenQu-Resume.pdf";
              window.open(url, "_blank", "noopener,noreferrer");
            }}
          >
            <HiOutlineDocumentText />
          </button>
          <span className="absolute top-full mt-2 text-[13px] font-mono text-gray-500 dark:text-white/40 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 pointer-events-none select-none">
            Resume
          </span>
        </div>

        {/* Contact — rose → hover white+rose icon */}
        <div className="group relative flex flex-col items-center">
          <Link
            href="/contact"
            className="bg-rose-500 p-3 text-white rounded-full flex items-center justify-center hover:scale-110 hover:bg-white hover:text-rose-500 hover:ring-1 hover:ring-rose-200 dark:bg-rose-600 dark:hover:bg-white dark:hover:text-rose-500 active:scale-100 transition-all duration-150 outline-none"
            aria-label="Contact"
          >
            <Mail size={18} />
          </Link>
          <span className="absolute top-full mt-2 text-[13px] font-mono text-gray-500 dark:text-white/40 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 pointer-events-none select-none">
            Contact
          </span>
        </div>
      </motion.div>
    </section>
  );
}
