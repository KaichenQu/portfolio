"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { timelineYears, workExperience } from "@/lib/data";
import { educationData } from "@/lib/data";

export default function Timeline() {
  const getEducationSegments = () => {
    const segments: {
      start: number;
      end: number;
      color: string;
      bgColor: string;
    }[] = [];
    educationData.forEach((edu, index) => {
      const startIndex = timelineYears.indexOf(edu.startYear);
      const endIndex = timelineYears.indexOf(edu.endYear);

      if (startIndex !== -1 && endIndex !== -1) {
        const startPercentage = (startIndex * 100) / (timelineYears.length - 1);
        const endPercentage = (endIndex * 100) / (timelineYears.length - 1);

        // 为不同的教育阶段设置不同的颜色
        const colors = [
          { line: "bg-blue-500", bg: "bg-blue-50 dark:bg-blue-950/30" },
          { line: "bg-purple-500", bg: "bg-purple-50 dark:bg-purple-950/30" },
        ];

        // 添加一点间隔，让每个线段的起始位置稍微往下一点
        const gap = 1; // 1% 的间隔

        segments.push({
          start: Math.min(startPercentage, endPercentage) + gap,
          end: Math.max(startPercentage, endPercentage),
          color: colors[index].line,
          bgColor: colors[index].bg,
        });
      }
    });
    return segments;
  };

  const educationSegments = getEducationSegments();

  return (
    <div className="relative h-[calc(100vh-8rem)] min-h-[600px]">
      <div className="flex h-full">
        {/* 左侧工作经历 */}
        <div className="w-[300px] mr-8 relative h-full">
          {workExperience.map((work, index) => {
            const yearIndex = timelineYears.indexOf(work.startDate);
            const position = (yearIndex * 100) / (timelineYears.length - 1);

            return (
              <motion.div
                key={index}
                className="absolute right-0 w-full transform -translate-y-1/2"
                style={{
                  top: `${position}%`,
                }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
              >
                <div className="flex items-center justify-end group">
                  <div className="p-4 rounded-lg bg-white/80 dark:bg-gray-800/80 shadow-lg backdrop-blur-sm w-full mr-4">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                      {work.company}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {work.role}
                    </p>
                  </div>
                  {/* 三角形指示器 */}
                  <div
                    className="w-0 h-0 
                    border-t-[6px] border-t-transparent 
                    border-l-[12px] border-l-gray-400 
                    border-b-[6px] border-b-transparent
                    dark:border-l-gray-600
                    group-hover:border-l-blue-500
                    transition-colors duration-300"
                  />
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="relative flex-1 h-full">
          {/* 灰色背景线 */}
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700 transform -translate-x-1/2" />

          {/* 教育时间段的彩色线 */}
          {educationSegments.map((segment, index) => (
            <motion.div
              key={index}
              className={cn(
                "absolute left-[calc(50%+4px)] w-0.5 transform -translate-x-1/2",
                segment.color
              )}
              initial={{ height: 0, opacity: 0 }}
              animate={{
                height: `${Math.abs(segment.end - segment.start)}%`,
                opacity: 1,
              }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              style={{
                top: `${segment.start}%`,
              }}
            />
          ))}

          {timelineYears.map((year, index) => {
            const education = educationData.find(
              (edu) => edu.startYear === year
            );
            const segment =
              educationSegments[
                educationData.findIndex((edu) => edu.startYear === year)
              ];

            return (
              <motion.div
                key={year}
                className="absolute left-1/2 transform -translate-x-1/2"
                style={{
                  top: `${(index * 100) / (timelineYears.length - 1)}%`,
                }}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="flex items-center group">
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full",
                      education
                        ? segment?.color
                        : "bg-gray-300 dark:bg-gray-600"
                    )}
                  />
                  <div className="ml-4">
                    <span className="text-gray-600 dark:text-gray-300 font-mono">
                      {year}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* 右侧教育经历卡片 */}
        <div className="w-[300px] ml-8 relative h-full">
          {educationData.map((edu, index) => {
            const segment = educationSegments[index];
            const cardPosition = (segment.start + segment.end) / 2;

            return (
              <motion.div
                key={index}
                className={cn(
                  "p-4 rounded-lg shadow-lg absolute w-full transform -translate-y-1/2",
                  segment.bgColor
                )}
                style={{
                  top: `${cardPosition}%`,
                }}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
              >
                <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                  {edu.school}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {edu.degree}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  {edu.startYear} - {edu.endYear}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
