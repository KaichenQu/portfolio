"use client";

import { useEffect, useState } from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import dynamic from "next/dynamic";
import Image from "next/image";
import clsx from "clsx";
import {
  Mail,
  ArrowUpRight,
  MapPin,
  Linkedin,
  ExternalLink,
  FileText,
} from "lucide-react";

import { GitHubBrandIcon } from "@/components/icons/GitHubBrandIcon";
import { Clock } from "@/components/timer";
import Loading from "@/components/ui/Loading";
import { projectsData } from "@/lib/data";
import { useSectionInView } from "@/lib/useInView";
import { useActiveSectionContext } from "@/containers/active-section";

const SkillMap = dynamic(() => import("@/components/skillmap"), {
  ssr: false,
  loading: () => <Loading />,
});
const Contact = dynamic(() => import("@/components/contact"), { ssr: false });

// ── Data ─────────────────────────────────────────────────────────────────────

const SECTIONS = [
  { id: "about", label: "About", hash: "/#about" },
  { id: "projects", label: "Projects", hash: "/#projects" },
  { id: "experience", label: "Experience", hash: "/#experience" },
  { id: "skills", label: "Skills", hash: "/#skills" },
  { id: "contact", label: "Contact", hash: "/#contact" },
  {
    id: "blog",
    label: "Blog",
    hash: "/blog",
    href: "https://blog.kelsonqu.com",
    external: true,
  },
] as const;

const EXPERIENCE = [
  {
    period: "Jul — Dec 2025",
    role: "Backend Engineer Intern",
    company: "Evenness Inc.",
    href: "https://www.evenness.rocks/",
    location: "Cupertino, CA",
    description:
      "Designed and shipped backend services for an early-stage product team, focusing on distributed systems, performance, and reliable infrastructure.",
    tags: ["Java", "Spring Boot", "Distributed Systems", "Redis", "MySQL"],
  },
  {
    period: "Jul 2022 — May 2023",
    role: "R&D Engineer Intern",
    company: "BMW Group",
    href: "https://www.bmwgroup.com/",
    location: "Shanghai, China",
    description:
      "Contributed to R&D initiatives at BMW Group, working on data engineering and internal tooling for automotive R&D workflows.",
    tags: ["Python", "Data Engineering", "ETL"],
  },
  {
    period: "Jul — Oct 2021",
    role: "R&D Engineer Intern",
    company: "CDP Group",
    href: "https://www.cdpgroupltd.com/",
    location: "Shanghai, China",
    description:
      "Early-career R&D work, gaining foundational engineering experience across the stack.",
    tags: ["Software Engineering"],
  },
];

const EDUCATION = [
  {
    period: "Sep 2023 — Aug 2026",
    degree: "M.S. · Computer Science",
    school: "Northeastern University",
    href: "https://www.northeastern.edu/",
    note: "GPA 3.9 / 4.0 · San Jose, CA",
  },
  {
    period: "Sep 2019 — Aug 2023",
    degree: "B.E. · Energy & Power Engineering",
    school: "East China Univ. of Science & Technology",
    href: "https://www.ecust.edu.cn/en/",
    note: "GPA 3.6 / 4.0 · Shanghai, China",
  },
];

// ── Cursor glow (dark mode only) ─────────────────────────────────────────────

function CursorGlow() {
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      document.documentElement.style.setProperty("--mx", `${e.clientX}px`);
      document.documentElement.style.setProperty("--my", `${e.clientY}px`);
    };
    window.addEventListener("mousemove", handle);
    return () => window.removeEventListener("mousemove", handle);
  }, []);
  return (
    <div
      className="pointer-events-none fixed inset-0 z-30 hidden dark:block"
      style={{
        background:
          "radial-gradient(600px at var(--mx, 50%) var(--my, 50%), rgba(56, 189, 248, 0.08), transparent 80%)",
      }}
    />
  );
}

// ── Scroll progress bar ──────────────────────────────────────────────────────

function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });
  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[2px] origin-left z-[9999] bg-gradient-to-r from-pink-400 via-sky-500 to-blue-400 pointer-events-none"
      style={{ scaleX }}
    />
  );
}

// ── Sidebar in-page nav ──────────────────────────────────────────────────────

function SidebarNav() {
  const { activeSection, setActiveSection, setTimeOfLastClick } =
    useActiveSectionContext();
  return (
    <nav className="hidden lg:block mt-8" aria-label="In-page jump links">
      <ul className="flex flex-col items-start gap-px">
        {SECTIONS.map((s) => {
          const isExternal = "external" in s && s.external;
          const isActive = !isExternal && activeSection === s.hash;
          return (
            <li key={s.id}>
              <a
                href={isExternal ? (s as { href: string }).href : `#${s.id}`}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
                onClick={() => {
                  if (isExternal) return;
                  setActiveSection(s.hash);
                  setTimeOfLastClick(Date.now());
                }}
                className="group inline-flex items-center py-1.5"
              >
                <span
                  className={clsx(
                    "h-px transition-all duration-300 mr-3",
                    isActive
                      ? "w-12 bg-gray-900 dark:bg-white"
                      : "w-6 bg-gray-300 dark:bg-white/30 group-hover:w-9 group-hover:bg-gray-700 dark:group-hover:bg-white/70",
                  )}
                />
                <span
                  className={clsx(
                    "text-[13px] font-mono uppercase tracking-[0.2em] transition-colors duration-300",
                    isActive
                      ? "text-gray-900 dark:text-white font-semibold"
                      : "text-gray-500 dark:text-white/55 group-hover:text-gray-800 dark:group-hover:text-white/85",
                  )}
                >
                  {s.label}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

// ── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({ resumeUrl }: { resumeUrl: string | null }) {
  return (
    <header className="lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:justify-between lg:py-14 pt-24 pb-12">
      <div className="flex flex-col items-center text-center">
        {/* Avatar — centered above the name */}
        <motion.div
          className="relative w-24 h-24 mb-5"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="relative w-24 h-24 rounded-full overflow-hidden ring-2 ring-sky-400/50 ring-offset-4 ring-offset-gray-50 dark:ring-offset-gray-900 bg-white dark:bg-gray-800 shadow-lg shadow-sky-500/10">
            <Image
              src="/boy.png"
              alt="Kelson Qu"
              fill
              priority
              className="object-cover object-center scale-110"
            />
          </div>
          {/* online indicator */}
          <span className="absolute bottom-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-white dark:bg-gray-900 ring-2 ring-gray-50 dark:ring-gray-900">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500" />
            </span>
          </span>
        </motion.div>

        {/* Name */}
        <motion.h1
          className="text-[2.5rem] lg:text-[2.75rem] font-bold tracking-[-0.02em] text-gray-900 dark:text-white leading-[1.02]"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
        >
          Kelson Qu
        </motion.h1>

        {/* Role */}
        <motion.p
          className="mt-2 text-[13px] font-mono uppercase tracking-[0.18em] text-sky-600 dark:text-sky-400"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.12 }}
        >
          Full-Stack Developer
        </motion.p>

        {/* Tagline */}
        <motion.p
          className="mt-4 text-[13.5px] text-gray-600 dark:text-white/65 max-w-[18rem] leading-[1.55]"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.18 }}
        >
          Building backend systems and scalable apps. M.S. CS @ Northeastern.
        </motion.p>

        {/* Status badge */}
        <motion.div
          className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.24 }}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[12px] font-mono uppercase tracking-wider text-green-700 dark:text-green-400">
            Open to opportunities
          </span>
        </motion.div>

        <div className="self-stretch">
          <SidebarNav />
        </div>
      </div>

      <div className="mt-10 lg:mt-0 flex flex-col items-center gap-6">
        {/* Social links */}
        <motion.ul
          className="flex items-center justify-center gap-5 text-gray-500 dark:text-white/55"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <li>
            <a
              href="https://github.com/KaichenQu"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              className="inline-block hover:text-gray-900 dark:hover:text-white hover:-translate-y-0.5 transition-all"
            >
              <GitHubBrandIcon className="h-5 w-5" />
            </a>
          </li>
          <li>
            <a
              href="https://www.linkedin.com/in/kelsonqu/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="inline-block hover:text-gray-900 dark:hover:text-white hover:-translate-y-0.5 transition-all"
            >
              <Linkedin className="h-5 w-5" />
            </a>
          </li>
          <li>
            <a
              href="mailto:kelsonqu@gmail.com"
              aria-label="Email"
              className="inline-block hover:text-gray-900 dark:hover:text-white hover:-translate-y-0.5 transition-all"
            >
              <Mail className="h-5 w-5" />
            </a>
          </li>
          {resumeUrl && (
            <li>
              <a
                href={resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Resume"
                className="inline-block hover:text-gray-900 dark:hover:text-white hover:-translate-y-0.5 transition-all"
              >
                <FileText className="h-5 w-5" />
              </a>
            </li>
          )}
        </motion.ul>

        {/* Footer */}
        <div className="w-full text-center text-[11px] text-gray-500 dark:text-white/45 leading-relaxed space-y-1.5">
          <div>
            &copy; {new Date().getFullYear()} Kelson Qu. Built with{" "}
            <a
              href="https://nextjs.org"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-700 dark:hover:text-white/80 underline-offset-2 hover:underline transition-colors"
            >
              Next.js
            </a>{" "}
            &amp;{" "}
            <a
              href="https://tailwindcss.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-700 dark:hover:text-white/80 underline-offset-2 hover:underline transition-colors"
            >
              Tailwind
            </a>
            .
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 font-mono">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3 w-3 text-sky-500/70" />
              <span className="uppercase tracking-[0.18em]">Bay Area</span>
              <Clock timeZone="America/Los_Angeles" />
            </span>
            <span className="text-gray-300 dark:text-white/20">·</span>
            <span
              className="inline-flex items-center gap-1.5"
              title="Your local time"
            >
              <span className="uppercase tracking-[0.18em]">You</span>
              <Clock />
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

// ── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  id,
  label,
  hash,
  threshold = 0.25,
  children,
}: {
  id: string;
  label: string;
  hash: string;
  threshold?: number;
  children: React.ReactNode;
}) {
  const { ref } = useSectionInView(hash, threshold);
  return (
    <section id={id} ref={ref} className="scroll-mt-16 mb-16 md:mb-20">
      <div className="sticky top-0 z-20 -mx-6 mb-5 w-screen bg-gray-50/90 dark:bg-gray-900/80 backdrop-blur-md py-3 px-6 lg:hidden border-b border-gray-200/50 dark:border-white/5">
        <h2 className="text-[12px] font-mono font-bold uppercase tracking-[0.22em] text-gray-900 dark:text-white">
          {label}
        </h2>
      </div>
      <h2 className="hidden lg:block text-[12px] font-mono font-bold uppercase tracking-[0.22em] text-gray-500 dark:text-white/55 mb-6">
        {label}
      </h2>
      {children}
    </section>
  );
}

// ── About ────────────────────────────────────────────────────────────────────

function AboutSection({ resumeUrl }: { resumeUrl: string | null }) {
  const focuses = [
    "Distributed Systems",
    "Backend Engineering",
    "Full-Stack APP",
    "Cloud DEV",
  ];
  const [resumeOpen, setResumeOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const pdfHref = resumeUrl || "/resume/KaichenQu-Resume.pdf";

  useEffect(() => {
    if (resumeOpen) setZoom(1);
  }, [resumeOpen]);

  useEffect(() => {
    if (!resumeOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setResumeOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [resumeOpen]);

  return (
    <Section id="about" label="About" hash="/#about">
      <motion.p
        className="text-[19px] md:text-[21px] text-gray-700 dark:text-white/75 leading-[1.55] font-medium tracking-tight max-w-[38rem]"
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        I build{" "}
        <span className="relative inline-block text-gray-900 dark:text-white font-semibold">
          backend systems
          <motion.span
            aria-hidden
            className="absolute left-0 right-0 bottom-0 h-[2px] bg-sky-500/70 dark:bg-sky-400/70 origin-left"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{
              duration: 0.6,
              delay: 0.35,
              ease: [0.22, 1, 0.36, 1],
            }}
          />
        </span>{" "}
        and{" "}
        <span className="relative inline-block text-gray-900 dark:text-white font-semibold">
          full-stack apps
          <motion.span
            aria-hidden
            className="absolute left-0 right-0 bottom-0 h-[2px] bg-sky-500/70 dark:bg-sky-400/70 origin-left"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{
              duration: 0.6,
              delay: 0.55,
              ease: [0.22, 1, 0.36, 1],
            }}
          />
        </span>{" "}
        shipped to production.
      </motion.p>
      <motion.ul
        className="mt-7 flex flex-nowrap gap-1.5 sm:gap-2 w-full"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.07, delayChildren: 0.3 } },
        }}
      >
        {focuses.map((f) => (
          <motion.li
            key={f}
            variants={{
              hidden: { opacity: 0, y: 10, scale: 0.96 },
              show: { opacity: 1, y: 0, scale: 1 },
            }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -2 }}
            className="min-w-0 whitespace-nowrap text-[10px] sm:text-[11.5px] md:text-[12.5px] font-mono px-2 sm:px-2.5 md:px-3 py-1.5 rounded-full bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/10 text-gray-700 dark:text-white/70 hover:border-sky-400/60 hover:text-gray-900 dark:hover:text-white hover:shadow-[0_0_0_3px_rgba(56,189,248,0.08)] transition-colors cursor-default"
          >
            {f}
          </motion.li>
        ))}
      </motion.ul>

      <motion.div
        className="mt-8 inline-flex items-center gap-3"
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="inline-flex items-center gap-2.5 text-[18px] sm:text-[22px] font-mono font-bold uppercase tracking-[0.2em] text-sky-600 dark:text-sky-400">
          <FileText className="h-6 w-6" />
          Resume
        </div>
        <button
          type="button"
          onClick={() => setResumeOpen(true)}
          className="group relative inline-flex items-center gap-1.5 text-[12.5px] font-mono uppercase tracking-wider px-3 py-1.5 rounded-md text-gray-700 dark:text-white/70 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
        >
          View
          <ArrowUpRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </button>
        <a
          href={pdfHref}
          download
          className="group relative inline-flex items-center text-[12.5px] font-mono uppercase tracking-wider text-gray-700 dark:text-white/70 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
        >
          <span className="relative">
            Download
            <span
              aria-hidden
              className="absolute left-0 -bottom-0.5 h-px w-full bg-current origin-left scale-x-100 transition-transform duration-300 group-hover:scale-x-0"
            />
            <span
              aria-hidden
              className="absolute left-0 -bottom-0.5 h-px w-full bg-sky-500 dark:bg-sky-400 origin-right scale-x-0 transition-transform duration-300 group-hover:origin-left group-hover:scale-x-100"
            />
          </span>
        </a>
      </motion.div>

      {resumeOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={() => setResumeOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Resume preview"
        >
          <motion.div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/70 to-black/80 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
          />
          <motion.div
            className="relative w-full max-w-5xl h-[88vh] flex flex-col rounded-2xl overflow-hidden border border-white/10 dark:border-white/5 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] bg-white dark:bg-zinc-950"
            initial={{ scale: 0.94, y: 24, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* macOS-style title bar */}
            <div className="relative flex items-center px-4 py-3 border-b border-gray-200/80 dark:border-white/[0.08] bg-gradient-to-b from-gray-50 to-white dark:from-zinc-900 dark:to-zinc-950">
              <div className="flex items-center gap-2 group/dots">
                <button
                  type="button"
                  onClick={() => setResumeOpen(false)}
                  aria-label="Close"
                  className="relative w-3 h-3 rounded-full bg-[#ff5f57] hover:bg-[#ff5f57] transition-colors flex items-center justify-center"
                >
                  <span className="opacity-0 group-hover/dots:opacity-100 text-[8px] leading-none text-black/60 font-bold transition-opacity">
                    ✕
                  </span>
                </button>
                <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
                <span className="w-3 h-3 rounded-full bg-[#28c840]" />
              </div>

              <div className="absolute left-1/2 -translate-x-1/2 inline-flex items-center gap-2 text-[12.5px] font-mono text-gray-600 dark:text-white/60 max-w-[60%] truncate">
                <FileText className="h-3.5 w-3.5 text-sky-500 dark:text-sky-400 flex-shrink-0" />
                <span className="truncate">KaichenQu — Resume.pdf</span>
              </div>

              <div className="ml-auto flex items-center gap-1">
                <div className="hidden sm:inline-flex items-center gap-0.5 mr-2 rounded-md border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-0.5">
                  <button
                    type="button"
                    onClick={() =>
                      setZoom((z) => Math.max(0.5, +(z - 0.1).toFixed(2)))
                    }
                    aria-label="Zoom out"
                    className="inline-flex items-center justify-center w-6 h-6 rounded text-gray-600 dark:text-white/60 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
                  >
                    −
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoom(1)}
                    className="inline-flex items-center justify-center min-w-[3rem] h-6 px-1.5 rounded text-[11px] font-mono tabular-nums text-gray-700 dark:text-white/70 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
                    aria-label="Reset zoom"
                    title="Reset zoom"
                  >
                    {Math.round(zoom * 100)}%
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setZoom((z) => Math.min(2.5, +(z + 0.1).toFixed(2)))
                    }
                    aria-label="Zoom in"
                    className="inline-flex items-center justify-center w-6 h-6 rounded text-gray-600 dark:text-white/60 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
                  >
                    +
                  </button>
                </div>
                <a
                  href={pdfHref}
                  download
                  className="group/dl inline-flex items-center gap-1.5 text-[11.5px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-md text-gray-600 dark:text-white/60 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
                  aria-label="Download resume"
                >
                  <span
                    aria-hidden
                    className="inline-block transition-transform group-hover/dl:translate-y-0.5"
                  >
                    ↓
                  </span>
                  Download
                </a>
                <a
                  href={pdfHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-7 h-7 rounded-md text-gray-500 dark:text-white/50 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
                  aria-label="Open in new tab"
                  title="Open in new tab"
                >
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>

            {/* PDF body */}
            <div className="relative flex-1 overflow-auto bg-[#f3f3f3] dark:bg-zinc-900 flex items-center justify-center">
              <div
                className="origin-center transition-transform duration-200 ease-out"
                style={{
                  transform: `scale(${zoom})`,
                  width: "100%",
                  height: "100%",
                }}
              >
                <iframe
                  src={`${pdfHref}#view=Fit&toolbar=0&navpanes=0&scrollbar=0`}
                  title="Resume"
                  className="w-full h-full block"
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </Section>
  );
}

// ── Experience ───────────────────────────────────────────────────────────────

function ExperienceSection() {
  return (
    <Section id="experience" label="Experience" hash="/#experience">
      <ol className="group/list space-y-1">
        {EXPERIENCE.map((entry, i) => (
          <motion.li
            key={entry.company}
            className="relative grid sm:grid-cols-[130px_1fr] gap-y-3 sm:gap-x-6 sm:p-5 sm:-mx-5 rounded-xl transition-all sm:hover:bg-sky-500/[0.05] sm:hover:shadow-[inset_0_1px_0_0_rgba(148,163,184,0.1)] sm:group-hover/list:opacity-50 sm:hover:!opacity-100"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.45, delay: i * 0.07 }}
          >
            <div className="text-[11.5px] font-mono font-semibold uppercase tracking-[0.1em] text-gray-500 dark:text-white/55 sm:pt-1.5 leading-relaxed">
              {entry.period}
            </div>

            <div>
              <h3>
                <a
                  href={entry.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-baseline gap-1.5 text-[17px] font-semibold tracking-tight text-gray-900 dark:text-white group/link hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
                >
                  <span>{entry.role}</span>
                  <span className="text-gray-400 dark:text-white/40 mx-0.5">
                    ·
                  </span>
                  <span>{entry.company}</span>
                  <ArrowUpRight className="h-3.5 w-3.5 -translate-y-px opacity-50 group-hover/link:opacity-100 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-1 transition-all" />
                </a>
              </h3>
              <p className="text-[12px] text-gray-500 dark:text-white/50 mt-1 font-mono">
                {entry.location}
              </p>
              <p className="mt-3 text-[15px] text-gray-700 dark:text-white/70 leading-[1.6]">
                {entry.description}
              </p>
              <ul className="mt-3.5 flex flex-wrap gap-1.5">
                {entry.tags.map((tag) => (
                  <li
                    key={tag}
                    className="text-[11.5px] font-mono px-2.5 py-1 rounded-full bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-200/70 dark:border-sky-500/20"
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            </div>
          </motion.li>
        ))}
      </ol>

      {/* Education */}
      <div className="mt-12 pt-10 border-t border-gray-100 dark:border-white/[0.06]">
        <h3 className="text-[12px] font-mono font-bold uppercase tracking-[0.22em] text-gray-500 dark:text-white/55 mb-5">
          Education
        </h3>
        <ol className="space-y-5">
          {EDUCATION.map((edu) => (
            <li
              key={edu.school}
              className="grid sm:grid-cols-[130px_1fr] gap-y-1 sm:gap-x-6 sm:p-3 sm:-mx-3 rounded-lg transition-colors hover:bg-gray-100/60 dark:hover:bg-white/[0.03]"
            >
              <div className="text-[11.5px] font-mono font-semibold uppercase tracking-[0.1em] text-gray-500 dark:text-white/55 sm:pt-1 leading-relaxed">
                {edu.period}
              </div>
              <div>
                <a
                  href={edu.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[16px] font-semibold tracking-tight text-gray-900 dark:text-white hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
                >
                  {edu.school}
                </a>
                <p className="text-[14px] text-gray-700 dark:text-white/70 mt-1">
                  {edu.degree}
                </p>
                <p className="text-[12px] text-gray-500 dark:text-white/50 mt-0.5 font-mono">
                  {edu.note}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}

// ── Projects ─────────────────────────────────────────────────────────────────

function ProjectsSection() {
  return (
    <Section id="projects" label="Projects" hash="/#projects" threshold={0.1}>
      <ol className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {projectsData.map((p, i) => {
          const primaryUrl = p.demoUrl || p.githubUrl || p.link || "";
          return (
            <motion.li
              key={p.title}
              className="group/card relative flex flex-col rounded-2xl border border-gray-200/70 dark:border-white/[0.08] bg-white/50 dark:bg-white/[0.02] overflow-hidden transition-all duration-300 hover:border-sky-300/60 dark:hover:border-sky-500/30 hover:bg-white dark:hover:bg-white/[0.04] hover:shadow-lg hover:shadow-sky-500/5 hover:-translate-y-0.5"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
            >
              {/* Image */}
              <div className="relative w-full aspect-[16/10] overflow-hidden bg-gray-100 dark:bg-white/[0.04]">
                <Image
                  src={p.imageUrl}
                  alt={p.title}
                  fill
                  sizes="(max-width: 640px) 100vw, 50vw"
                  className="object-cover transition-transform duration-500 group-hover/card:scale-[1.04]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300" />
                {(p.githubUrl || p.demoUrl) && (
                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300">
                    {p.githubUrl && (
                      <a
                        href={p.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Source code"
                        className="p-1.5 rounded-lg bg-black/60 backdrop-blur-sm text-white/90 hover:text-white hover:bg-black/80 transition-all"
                      >
                        <GitHubBrandIcon className="h-3.5 w-3.5" />
                      </a>
                    )}
                    {p.demoUrl && (
                      <a
                        href={p.demoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Live demo"
                        className="p-1.5 rounded-lg bg-black/60 backdrop-blur-sm text-white/90 hover:text-white hover:bg-black/80 transition-all"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex flex-col flex-1 p-4">
                <h3 className="mb-2">
                  {primaryUrl ? (
                    <a
                      href={primaryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-baseline gap-1 text-[16px] font-semibold tracking-tight text-gray-900 dark:text-white group/link hover:text-sky-600 dark:hover:text-sky-400 transition-colors leading-snug"
                    >
                      <span>{p.title}</span>
                      <ArrowUpRight className="h-3.5 w-3.5 -translate-y-px opacity-50 group-hover/link:opacity-100 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-all flex-shrink-0" />
                    </a>
                  ) : (
                    <span className="text-[16px] font-semibold tracking-tight text-gray-900 dark:text-white leading-snug">
                      {p.title}
                    </span>
                  )}
                </h3>
                <p className="text-[13.5px] text-gray-700 dark:text-white/65 leading-[1.55] line-clamp-3 mb-3.5">
                  {p.description}
                </p>
                <ul className="mt-auto flex flex-wrap gap-1.5">
                  {p.tags.slice(0, 4).map((tag) => (
                    <li
                      key={tag}
                      className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-200/70 dark:border-sky-500/20"
                    >
                      {tag}
                    </li>
                  ))}
                  {p.tags.length > 4 && (
                    <li className="text-[11px] font-mono px-2 py-0.5 rounded-md text-gray-500 dark:text-white/45">
                      +{p.tags.length - 4}
                    </li>
                  )}
                </ul>
              </div>
            </motion.li>
          );
        })}
      </ol>
    </Section>
  );
}

// ── Skills ───────────────────────────────────────────────────────────────────

function SkillsSection() {
  return (
    <Section id="skills" label="Skills" hash="/#skills" threshold={0.1}>
      <SkillMap />
    </Section>
  );
}

// ── Contact ──────────────────────────────────────────────────────────────────

function ContactSection() {
  return (
    <Section id="contact" label="Contact" hash="/#contact" threshold={0.2}>
      <Contact />
    </Section>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/resume")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.filename) setResumeUrl(`/resume/${d.filename}`);
      })
      .catch(() => {});
  }, []);

  return (
    <>
      <ScrollProgress />
      <CursorGlow />
      {/* lg:px-20 keeps the right column clear of the fixed theme toggle
          (right-5 + 48px button) on 1024–1340px viewports. */}
      <div className="mx-auto min-h-screen max-w-screen-xl px-6 lg:flex lg:gap-x-12 lg:px-20">
        <div className="lg:w-2/5 xl:w-[38%]">
          <Sidebar resumeUrl={resumeUrl} />
        </div>
        <main className="lg:w-3/5 xl:w-[62%] lg:py-24 pt-8 pb-16">
          <AboutSection resumeUrl={resumeUrl} />
          <ProjectsSection />
          <ExperienceSection />
          <SkillsSection />
          <ContactSection />
        </main>
      </div>
    </>
  );
}
