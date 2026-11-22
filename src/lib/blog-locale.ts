import type { Section } from "./devlog";

export type BlogLocale = "en" | "zh-Hans";

export function blogPath(locale: BlogLocale, suffix = "") {
  return (locale === "zh-Hans" ? "/blog/zh" : "/blog") + suffix;
}

const ZH_SECTIONS: Record<Section, string> = {
  Maps: "知识地图",
  "Debug cases": "排错案例",
  "Design cases": "设计案例",
  Techniques: "技术",
  Lessons: "教训",
  Cheatsheets: "速查",
  Glossary: "术语",
};

export function sectionLabel(section: Section, locale: BlogLocale) {
  return locale === "zh-Hans" ? ZH_SECTIONS[section] : section;
}

export function readingTime(minutes: number, locale: BlogLocale) {
  return locale === "zh-Hans" ? `阅读约 ${minutes} 分钟` : `${minutes} min read`;
}

export function noteCount(count: number, locale: BlogLocale) {
  return locale === "zh-Hans" ? `${count} 篇笔记` : `${count} ${count === 1 ? "note" : "notes"}`;
}

export function redactedLabel(locale: BlogLocale) {
  return locale === "zh-Hans" ? "已遮盖" : "redacted";
}
