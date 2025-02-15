import React from "react";
import { FaGithub, FaLinkedin } from "react-icons/fa";
import { Mail } from "lucide-react";
import { HiOutlineDocumentText } from "react-icons/hi";
import { Clock } from "./timer";
import { LastUpdate } from "./last-update";

export default function Footer() {
  return (
    <footer className="relative z-10 w-full mt-auto py-6 px-4 text-center text-gray-500 border-t border-gray-100 dark:border-gray-800">
      <div className="mb-8 flex flex-col gap-4">
        <div className="flex items-center justify-center gap-4">
          <a
            href="https://github.com/KaichenQu"
            target="_blank"
            className="text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
          >
            <FaGithub className="h-6 w-6" />
          </a>
          <a
            href="https://www.linkedin.com/in/kelsonqu/"
            target="_blank"
            className="text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
          >
            <FaLinkedin className="h-6 w-6" />
          </a>
          <a
            href="mailto:your.email@example.com"
            className="text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
          >
            <Mail className="h-6 w-6" />
          </a>
          <a
            href="/KaichenQu-Resume_A.pdf"
            target="_blank"
            className="text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
          >
            <HiOutlineDocumentText className="h-6 w-6" />
          </a>
        </div>

        <div className="h-[1px] w-full max-w-[500px] bg-gray-200 dark:bg-gray-800 mx-auto" />

        <div className="flex flex-col gap-2 text-sm">
          <p>
            <span className="font-bold">Do something great!</span>
          </p>
          <p>
            Developed with{" "}
            <a
              href="https://nextjs.org"
              target="_blank"
              className="font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors underline"
            >
              Next.js
            </a>{" "}
            and{" "}
            <a
              href="https://tailwindcss.com"
              target="_blank"
              className="font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors underline"
            >
              Tailwind CSS
            </a>
          </p>
          <div className="flex flex-col gap-2">
            <p className="text-xs">
              &copy; {new Date().getFullYear()} Kelson. All rights reserved.
            </p>
            <LastUpdate />
          </div>
          <div className="flex items-center justify-center gap-2">
            <p>Now</p>
            <Clock />
          </div>
        </div>
      </div>
    </footer>
  );
}
