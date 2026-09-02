"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { GitHubBrandIcon } from "@/components/icons/GitHubBrandIcon";
import { ProjectInfo } from "@/lib/types";

type ProjectProps = ProjectInfo;

export default function Project({
  title,
  description,
  tags,
  imageUrl,
  imageUrlDark,
  githubUrl,
  demoUrl,
  link,
}: ProjectProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["0 1", "1.33 1"],
  });
  const scaleProgress = useTransform(scrollYProgress, [0, 1], [0.8, 1]);
  const opacityProgress = useTransform(scrollYProgress, [0, 1], [0.6, 1]);

  return (
    <motion.div
      ref={ref}
      style={{
        scale: scaleProgress,
        opacity: opacityProgress,
      }}
      className="group w-full max-w-2xl mb-8"
    >
      <div className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col dark:bg-white/10">
        {/* Heroes are rendered 16:10 per theme; the CSS swap avoids a hydration flash. */}
        <div className="relative aspect-[16/10] w-full overflow-hidden">
          <Image
            src={imageUrl}
            alt={title}
            fill
            sizes="(min-width: 1024px) 42rem, 100vw"
            className={`object-cover transform group-hover:scale-110 transition-transform duration-500 ${imageUrlDark ? "dark:hidden" : ""}`}
          />
          {imageUrlDark && (
            <Image
              src={imageUrlDark}
              alt={title}
              fill
              sizes="(min-width: 1024px) 42rem, 100vw"
              className="object-cover transform group-hover:scale-110 transition-transform duration-500 hidden dark:block"
            />
          )}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4">
            {githubUrl && (
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-blue-400 transition-colors"
              >
                <GitHubBrandIcon className="w-8 h-8" />
              </a>
            )}
            {demoUrl && (
              <a
                href={demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-blue-400 transition-colors"
              >
                <ExternalLink className="w-8 h-8" />
              </a>
            )}
          </div>
        </div>

        <div className="p-6 flex flex-col flex-grow">
          <h3 className="text-xl font-semibold mb-2 line-clamp-1">{title}</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4 flex-grow line-clamp-3">
            {description}
          </p>
          <div className="flex flex-wrap gap-2 mt-auto">
            {tags.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-800 rounded-full text-gray-800 dark:text-gray-200"
              >
                {tag}
              </span>
            ))}
          </div>
          {link && (
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="self-end mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600 transition-colors text-sm"
            >
              View more
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}
