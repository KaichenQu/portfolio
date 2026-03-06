"use client";

import React from "react";
import { motion } from "framer-motion";
import { useSectionInView } from "@/lib/useInView";
import SubmitBtn from "./submit-btn";
import { toast } from "react-hot-toast";
import { Mail, MapPin } from "lucide-react";
import { BsLinkedin } from "react-icons/bs";
import { HiOutlineDocumentText } from "react-icons/hi";

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

export default function Contact() {
  const { ref } = useSectionInView("/contact");
  const [resumeUrl, setResumeUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetch("/api/resume")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.filename) setResumeUrl(`/resume/${data.filename}`);
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const name = formData.get("name");
    const message = formData.get("message");

    try {
      const res = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, message }),
      });

      if (!res.ok) throw new Error("Failed to send message");

      form.reset();
      toast.success("Message sent successfully!");
    } catch {
      toast.error("Something went wrong!");
    }
  }

  return (
    <motion.section
      id="contact"
      ref={ref}
      className="mt-10 mb-20 sm:mb-28 scroll-mt-28 w-full max-w-5xl"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
    >
      {/* Heading */}
      <div className="text-center mb-12">
        <h2 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-pink-400 to-violet-400 bg-clip-text text-transparent mb-4">
          Get In Touch
        </h2>
        <p className="text-gray-600 dark:text-white/60 text-lg">
          Have a project in mind or just want to say hi? I&apos;d love to hear
          from you.
        </p>
      </div>

      {/* Resume card — above the grid, same entrance timing */}
      <motion.div
        variants={cardVariants}
        initial="hidden"
        whileInView="visible"
        transition={{ duration: 0.5, delay: 0.1 }}
        viewport={{ once: true }}
        className="mb-8 flex flex-col sm:flex-row items-center gap-5 p-5 rounded-2xl bg-gradient-to-r from-violet-50 to-fuchsia-50 dark:from-violet-900/10 dark:to-fuchsia-900/10 border border-violet-100 dark:border-violet-500/15 backdrop-blur-sm"
      >
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-500/15 border border-violet-200/70 dark:border-violet-500/20">
            <HiOutlineDocumentText className="w-[18px] h-[18px] text-violet-600 dark:text-violet-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-800 dark:text-white/85">
              My Resume
            </p>
            <p className="text-xs text-gray-500 dark:text-white/40 mt-0.5">
              Backend &amp; full-stack · Java · TypeScript · Go · Distributed
              Systems · Open to full-time roles
            </p>
          </div>
        </div>
        <a
          href={resumeUrl ?? "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 flex items-center gap-2 px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 dark:bg-violet-600 dark:hover:bg-violet-500 text-white text-sm font-medium transition-all hover:scale-[1.03] active:scale-100 shadow-sm shadow-violet-200/60 dark:shadow-violet-900/30 whitespace-nowrap"
        >
          <HiOutlineDocumentText className="w-4 h-4" />
          View Resume
        </a>
      </motion.div>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Info card */}
        <motion.div
          variants={cardVariants}
          initial="hidden"
          whileInView="visible"
          transition={{ duration: 0.5, delay: 0.1 }}
          viewport={{ once: true }}
          className="flex flex-col gap-8 p-8 rounded-2xl bg-white/60 dark:bg-white/5 backdrop-blur-sm border border-white/40 dark:border-white/10 shadow-lg"
        >
          {/* Availability badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 w-fit">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-green-700 dark:text-green-400">
              Open to New Opportunities
            </span>
          </div>

          {/* Intro text */}
          <div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90 mb-2">
              Let&apos;s build something great together
            </h3>
            <p className="text-gray-600 dark:text-white/50 text-sm leading-relaxed">
              I&apos;m currently open to full-time roles and interesting
              projects. Whether you have a question or just want to connect — my
              inbox is always open.
            </p>
          </div>

          {/* Divider */}
          <div className="h-px bg-gray-200 dark:bg-white/10" />

          {/* Contact info */}
          <div className="flex flex-col gap-5">
            <a
              href="mailto:kelsonqu@gmail.com"
              className="flex items-center gap-3 group"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-pink-50 dark:bg-pink-500/10 border border-pink-100 dark:border-pink-500/20 group-hover:scale-110 transition-transform">
                <Mail className="w-4 h-4 text-pink-500 dark:text-pink-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400 dark:text-white/40 mb-0.5">
                  Email
                </p>
                <span className="text-sm font-medium text-gray-700 dark:text-white/80 group-hover:text-pink-500 dark:group-hover:text-pink-400 transition-colors">
                  kelsonqu@gmail.com
                </span>
              </div>
            </a>

            <a
              href="https://www.linkedin.com/in/kelsonqu/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 group"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 group-hover:scale-110 transition-transform">
                <BsLinkedin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400 dark:text-white/40 mb-0.5">
                  LinkedIn
                </p>
                <span className="text-sm font-medium text-gray-700 dark:text-white/80 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  linkedin.com/in/kelsonqu
                </span>
              </div>
            </a>

            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-500/10 border border-violet-100 dark:border-violet-500/20">
                <MapPin className="w-4 h-4 text-violet-500 dark:text-violet-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400 dark:text-white/40 mb-0.5">
                  Location
                </p>
                <span className="text-sm font-medium text-gray-700 dark:text-white/80">
                  San Francisco Bay Area, CA
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right: Form card */}
        <motion.div
          variants={cardVariants}
          initial="hidden"
          whileInView="visible"
          transition={{ duration: 0.5, delay: 0.2 }}
          viewport={{ once: true }}
          className="p-8 rounded-2xl bg-white/60 dark:bg-white/5 backdrop-blur-sm border border-white/40 dark:border-white/10 shadow-lg"
        >
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-6">
            Send me a message
          </h3>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              className="px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-white/5 text-gray-800 dark:text-white/80 placeholder:text-gray-400 dark:placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-pink-300 dark:focus:ring-pink-500/40 transition-all text-sm"
              name="name"
              type="text"
              maxLength={100}
              required
              placeholder="Your name or company(if applicable)"
              aria-label="Your name or company (if applicable)"
            />
            <textarea
              className="min-h-[240px] px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-white/5 text-gray-800 dark:text-white/80 placeholder:text-gray-400 dark:placeholder:text-white/25 resize-none focus:outline-none focus:ring-2 focus:ring-pink-300 dark:focus:ring-pink-500/40 transition-all text-sm leading-relaxed"
              name="message"
              placeholder="Your message..."
              required
              maxLength={5000}
              aria-label="Your message"
            />
            <div className="flex justify-end">
              <SubmitBtn text="Send Message" />
            </div>
          </form>
        </motion.div>
      </div>
    </motion.section>
  );
}
