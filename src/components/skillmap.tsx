"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { InfiniteSlider } from "./ui/infinite-slider";

// ── Data ─────────────────────────────────────────────────────────────────────

type Level = "core" | "strong" | "proficient" | "familiar";

type Skill = {
  name: string;
  icon?: string;
  level: Level;
};

type Group = {
  label: string;
  caption: string;
  skills: Skill[];
};

const GROUPS: Group[] = [
  {
    label: "Languages",
    caption: "Daily drivers",
    skills: [
      { name: "Java", icon: "/skills-icons/Java-Dark.svg", level: "core" },
      { name: "TypeScript", icon: "/skills-icons/TypeScript.svg", level: "core" },
      { name: "Go", icon: "/skills-icons/GoLang.svg", level: "strong" },
      { name: "Python", icon: "/skills-icons/Python-Dark.svg", level: "proficient" },
      { name: "C++", icon: "/skills-icons/CPP.svg", level: "familiar" },
      { name: "Kotlin", icon: "/skills-icons/Kotlin-Dark.svg", level: "familiar" },
    ],
  },
  {
    label: "Backend & Frameworks",
    caption: "Where I spend most of my time",
    skills: [
      { name: "Spring Boot", icon: "/skills-icons/Spring-Dark.svg", level: "core" },
      { name: "Spring Cloud", icon: "/skills-icons/Spring-Dark.svg", level: "strong" },
      { name: "Node.js", icon: "/skills-icons/NodeJS-Dark.svg", level: "strong" },
      { name: "Next.js", icon: "/skills-icons/nextjs.jpeg", level: "core" },
      { name: "React", icon: "/skills-icons/React-Dark.svg", level: "core" },
      { name: "FastAPI", icon: "/skills-icons/FastAPI.svg", level: "proficient" },
      { name: "gRPC", level: "strong" },
      { name: "WebSocket", level: "strong" },
    ],
  },
  {
    label: "Data & Messaging",
    caption: "Persistence, queues, search",
    skills: [
      { name: "MySQL", icon: "/skills-icons/MySQL-Dark.svg", level: "core" },
      { name: "PostgreSQL", icon: "/skills-icons/PostgreSQL-Dark.svg", level: "strong" },
      { name: "Redis", icon: "/skills-icons/Redis-Dark.svg", level: "core" },
      { name: "MongoDB", icon: "/skills-icons/MongoDB.svg", level: "proficient" },
      { name: "Elasticsearch", icon: "/skills-icons/Elasticsearch-Dark.svg", level: "proficient" },
      { name: "Kafka", level: "strong" },
      { name: "RocketMQ", icon: "/skills-icons/rocketmq.png", level: "strong" },
      { name: "RabbitMQ", icon: "/skills-icons/RabbitMQ-Dark.svg", level: "proficient" },
      { name: "Zookeeper", icon: "/skills-icons/zookeeper.png", level: "proficient" },
    ],
  },
  {
    label: "Infra & Cloud",
    caption: "How it runs in production",
    skills: [
      { name: "Docker", icon: "/skills-icons/Docker.svg", level: "core" },
      { name: "Kubernetes", icon: "/skills-icons/Kubernetes.svg", level: "proficient" },
      { name: "AWS", icon: "/skills-icons/AWS-Dark.svg", level: "strong" },
      { name: "GCP", icon: "/skills-icons/GCP-Dark.svg", level: "proficient" },
      { name: "Linux", icon: "/skills-icons/linux.jpeg", level: "strong" },
      { name: "Jenkins", icon: "/skills-icons/Jenkins-Dark.svg", level: "proficient" },
      { name: "Prometheus", icon: "/skills-icons/prometheus.png", level: "proficient" },
      { name: "Git", icon: "/skills-icons/Git.svg", level: "core" },
    ],
  },
];

// Carousel — ordered by category: Languages → Frameworks → Data → Infra → Cloud
const SLIDER_ICONS = [
  // Languages
  { src: "/skills-icons/Java-Dark.svg", alt: "Java" },
  { src: "/skills-icons/TypeScript.svg", alt: "TypeScript" },
  { src: "/skills-icons/GoLang.svg", alt: "Go" },
  { src: "/skills-icons/Python-Dark.svg", alt: "Python" },
  { src: "/skills-icons/CPP.svg", alt: "C++" },
  { src: "/skills-icons/Kotlin-Dark.svg", alt: "Kotlin" },
  // Frameworks
  { src: "/skills-icons/Spring-Dark.svg", alt: "Spring" },
  { src: "/skills-icons/React-Dark.svg", alt: "React" },
  { src: "/skills-icons/nextjs.jpeg", alt: "Next.js" },
  { src: "/skills-icons/NodeJS-Dark.svg", alt: "Node.js" },
  { src: "/skills-icons/FastAPI.svg", alt: "FastAPI" },
  // Data & messaging
  { src: "/skills-icons/MySQL-Dark.svg", alt: "MySQL" },
  { src: "/skills-icons/PostgreSQL-Dark.svg", alt: "PostgreSQL" },
  { src: "/skills-icons/Redis-Dark.svg", alt: "Redis" },
  { src: "/skills-icons/MongoDB.svg", alt: "MongoDB" },
  { src: "/skills-icons/Elasticsearch-Dark.svg", alt: "Elasticsearch" },
  { src: "/skills-icons/rocketmq.png", alt: "RocketMQ" },
  { src: "/skills-icons/RabbitMQ-Dark.svg", alt: "RabbitMQ" },
  { src: "/skills-icons/zookeeper.png", alt: "Zookeeper" },
  // Infra & cloud
  { src: "/skills-icons/Docker.svg", alt: "Docker" },
  { src: "/skills-icons/Kubernetes.svg", alt: "Kubernetes" },
  { src: "/skills-icons/Jenkins-Dark.svg", alt: "Jenkins" },
  { src: "/skills-icons/prometheus.png", alt: "Prometheus" },
  { src: "/skills-icons/AWS-Dark.svg", alt: "AWS" },
  { src: "/skills-icons/GCP-Dark.svg", alt: "GCP" },
  { src: "/skills-icons/linux.jpeg", alt: "Linux" },
  { src: "/skills-icons/Git.svg", alt: "Git" },
];

// ── Visuals ──────────────────────────────────────────────────────────────────

const LEVEL_STYLES: Record<
  Level,
  { dot: string; ring: string; label: string }
> = {
  core: {
    dot: "bg-emerald-500",
    ring: "border-emerald-300/60 dark:border-emerald-400/30 hover:border-emerald-500/80 dark:hover:border-emerald-300/60",
    label: "Core",
  },
  strong: {
    dot: "bg-sky-500",
    ring: "border-sky-300/60 dark:border-sky-400/30 hover:border-sky-500/80 dark:hover:border-sky-300/60",
    label: "Strong",
  },
  proficient: {
    dot: "bg-amber-500",
    ring: "border-amber-300/60 dark:border-amber-400/30 hover:border-amber-500/80 dark:hover:border-amber-300/60",
    label: "Proficient",
  },
  familiar: {
    dot: "bg-gray-400 dark:bg-white/30",
    ring: "border-gray-200 dark:border-white/10 hover:border-gray-400 dark:hover:border-white/30",
    label: "Familiar",
  },
};

function Chip({ skill, idx }: { skill: Skill; idx: number }) {
  const style = LEVEL_STYLES[skill.level];
  return (
    <motion.li
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.3, delay: Math.min(idx * 0.025, 0.4) }}
      className={`group/chip inline-flex items-center gap-2 pl-2.5 pr-3.5 py-2 rounded-full bg-white dark:bg-white/[0.04] border ${style.ring} shadow-sm shadow-gray-900/[0.04] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-sky-500/[0.1]`}
      title={style.label}
    >
      {skill.icon ? (
        <span className="relative h-[18px] w-[18px] shrink-0">
          <Image
            src={skill.icon}
            alt=""
            fill
            sizes="18px"
            className="object-contain dark:brightness-110"
          />
        </span>
      ) : (
        <span className={`h-2 w-2 rounded-full ${style.dot} shrink-0`} />
      )}
      <span className="text-[13px] font-medium text-gray-800 dark:text-white/85 leading-none">
        {skill.name}
      </span>
    </motion.li>
  );
}

function Legend() {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] font-mono uppercase tracking-[0.12em] text-gray-500 dark:text-white/55">
      {(["core", "strong", "proficient", "familiar"] as Level[]).map((l) => (
        <li key={l} className="inline-flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${LEVEL_STYLES[l].dot}`} />
          {LEVEL_STYLES[l].label}
        </li>
      ))}
    </ul>
  );
}

// ── Component ────────────────────────────────────────────────────────────────

export default function SkillMap() {
  return (
    <div className="w-full">
      {/* Legend */}
      <div className="mb-6">
        <Legend />
      </div>

      {/* Grouped chips */}
      <div className="space-y-7">
        {GROUPS.map((g, gi) => (
          <motion.section
            key={g.label}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.4, delay: gi * 0.05 }}
          >
            <div className="flex items-baseline gap-3 mb-4">
              <h3 className="text-[16px] font-semibold tracking-tight text-gray-900 dark:text-white">
                {g.label}
              </h3>
              <span className="hidden sm:inline text-[12px] text-gray-500 dark:text-white/50 font-mono">
                {g.caption}
              </span>
              <div className="flex-1 h-px bg-gradient-to-r from-gray-300/70 to-transparent dark:from-white/15" />
            </div>
            <ul className="flex flex-wrap gap-2">
              {g.skills.map((s, si) => (
                <Chip key={s.name} skill={s} idx={si} />
              ))}
            </ul>
          </motion.section>
        ))}
      </div>

      {/* Marquee */}
      <div className="mt-10 pt-6 border-t border-gray-100 dark:border-white/[0.06]">
        <p className="text-[11px] font-mono uppercase tracking-[0.22em] text-gray-500 dark:text-white/50 mb-4">
          The full toolkit
        </p>
        <div className="relative">
          <InfiniteSlider gap={32} duration={60}>
            {SLIDER_ICONS.map((icon, index) => (
              <Image
                key={`${icon.alt}-${index}`}
                src={icon.src}
                alt={icon.alt}
                width={28}
                height={28}
                style={{ width: "auto", height: "28px" }}
                className="opacity-60 hover:opacity-100 dark:brightness-110 transition-opacity duration-200"
              />
            ))}
          </InfiniteSlider>
          <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-gray-50 to-transparent dark:from-gray-900" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-gray-50 to-transparent dark:from-gray-900" />
        </div>
      </div>
    </div>
  );
}
