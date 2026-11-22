"use client";

import NextLink from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useActiveSectionContext } from "@/containers/active-section";
import { blogPath, type BlogLocale } from "@/lib/blog-locale";
import { links } from "@/lib/data";

const ZH_LINKS: Record<string, string> = {
  "/#about": "关于",
  "/#projects": "项目",
  "/#experience": "经历",
  "/#skills": "技能",
  "/#contact": "联系",
  "/blog": "博客",
};

/** The site nav list of the home sidebar and the blog column; `active` is the hash of the current item. */
export default function SidebarNav({ active, locale = "en" }: { active: string; locale?: BlogLocale }) {
  const { setActiveSection, setTimeOfLastClick } = useActiveSectionContext();
  // On the home page section items are plain in-page anchors; elsewhere they route back to it.
  const onHome = usePathname() === "/";
  const Anchor = onHome ? "a" : NextLink;
  const zh = locale === "zh-Hans";

  return (
    <nav
      className="hidden lg:block mt-8"
      aria-label={zh ? "站点导航" : onHome ? "In-page jump links" : "Site"}
    >
      <ul className="flex flex-col items-start gap-px">
        {links.map((link) => {
          const isSection = link.hash.startsWith("/#");
          const isActive = link.hash === active;
          const href = link.hash === "/blog" ? blogPath(locale) : link.hash;
          return (
            <li key={link.hash}>
              <Anchor
                href={onHome && isSection ? href.slice(1) : href}
                aria-current={isActive || undefined}
                onClick={() => {
                  if (!isSection) return;
                  setActiveSection(link.hash);
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
                  {zh ? ZH_LINKS[link.hash] ?? link.nameEng : link.nameEng}
                </span>
              </Anchor>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
