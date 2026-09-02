"use client";

import React from "react";
import { motion } from "framer-motion";
import { useSectionInView } from "@/lib/useInView";
import { toast } from "react-hot-toast";
import {
  Mail,
  MapPin,
  ArrowUpRight,
  Send,
  Linkedin,
  FileText,
} from "lucide-react";
import { GitHubBrandIcon } from "@/components/icons/GitHubBrandIcon";

const cardBase =
  "rounded-2xl border border-gray-200/70 dark:border-white/[0.08] bg-white/50 dark:bg-white/[0.02] transition-all duration-300";

export default function Contact() {
  const { ref } = useSectionInView("/#contact");
  const [resumeUrl, setResumeUrl] = React.useState<string | null>(null);
  const [sending, setSending] = React.useState(false);

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

    setSending(true);
    try {
      const res = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, message }),
      });
      if (!res.ok) throw new Error("Failed to send");
      form.reset();
      toast.success("Message sent successfully!");
    } catch {
      toast.error("Something went wrong!");
    } finally {
      setSending(false);
    }
  }

  return (
    <motion.div
      ref={ref}
      className="space-y-3"
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      {/* Heading card */}
      <div className={`${cardBase} p-5`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white tracking-tight">
              Let&apos;s build something together
            </h3>
            <p className="mt-1.5 text-xs text-gray-500 dark:text-white/50 leading-relaxed">
              Open to full-time roles and interesting projects. My inbox is
              always open.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 flex-shrink-0">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-500" />
            </span>
            <span className="text-[10px] font-medium text-green-700 dark:text-green-400">
              Available
            </span>
          </span>
        </div>
      </div>

      {/* Contact bento grid */}
      <div className="grid grid-cols-2 gap-3">
        <a
          href="mailto:kelsonqu@gmail.com"
          className={`${cardBase} group p-4 hover:border-pink-300/60 dark:hover:border-pink-500/30 hover:bg-white dark:hover:bg-white/[0.04]`}
        >
          <div className="flex items-center gap-2.5 mb-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-pink-50 dark:bg-pink-500/10 border border-pink-100 dark:border-pink-500/20">
              <Mail className="w-3.5 h-3.5 text-pink-500 dark:text-pink-400" />
            </div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400 dark:text-white/30">
              Email
            </span>
            <ArrowUpRight className="ml-auto h-3 w-3 text-gray-300 dark:text-white/25 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </div>
          <p className="text-xs font-medium text-gray-700 dark:text-white/80 group-hover:text-pink-500 dark:group-hover:text-pink-400 transition-colors break-all">
            kelsonqu@gmail.com
          </p>
        </a>

        <a
          href="https://www.linkedin.com/in/kelsonqu/"
          target="_blank"
          rel="noopener noreferrer"
          className={`${cardBase} group p-4 hover:border-blue-300/60 dark:hover:border-blue-500/30 hover:bg-white dark:hover:bg-white/[0.04]`}
        >
          <div className="flex items-center gap-2.5 mb-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20">
              <Linkedin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400 dark:text-white/30">
              LinkedIn
            </span>
            <ArrowUpRight className="ml-auto h-3 w-3 text-gray-300 dark:text-white/25 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </div>
          <p className="text-xs font-medium text-gray-700 dark:text-white/80 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            in/kelsonqu
          </p>
        </a>

        <a
          href="https://github.com/KaichenQu"
          target="_blank"
          rel="noopener noreferrer"
          className={`${cardBase} group p-4 hover:border-gray-400/60 dark:hover:border-white/30 hover:bg-white dark:hover:bg-white/[0.04]`}
        >
          <div className="flex items-center gap-2.5 mb-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/15">
              <GitHubBrandIcon className="w-3.5 h-3.5 text-gray-700 dark:text-white/80" />
            </div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400 dark:text-white/30">
              GitHub
            </span>
            <ArrowUpRight className="ml-auto h-3 w-3 text-gray-300 dark:text-white/25 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </div>
          <p className="text-xs font-medium text-gray-700 dark:text-white/80 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
            @KaichenQu
          </p>
        </a>

        <div className={`${cardBase} p-4`}>
          <div className="flex items-center gap-2.5 mb-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-500/10 border border-sky-100 dark:border-sky-500/20">
              <MapPin className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
            </div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400 dark:text-white/30">
              Location
            </span>
          </div>
          <p className="text-xs font-medium text-gray-700 dark:text-white/80">
            SF Bay Area, CA
          </p>
        </div>
      </div>

      {/* Resume CTA */}
      {resumeUrl && (
        <a
          href={resumeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`${cardBase} group flex items-center gap-3 p-4 hover:border-sky-300/60 dark:hover:border-sky-500/30 hover:bg-sky-50/30 dark:hover:bg-sky-500/[0.04]`}
        >
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-sky-50 dark:bg-sky-500/10 border border-sky-100 dark:border-sky-500/20 flex-shrink-0">
            <FileText className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              View My Resume
            </p>
            <p className="text-[11px] text-gray-500 dark:text-white/40 mt-0.5">
              Backend · Full-Stack · Distributed Systems
            </p>
          </div>
          <ArrowUpRight className="h-4 w-4 text-gray-400 dark:text-white/40 group-hover:text-sky-500 dark:group-hover:text-sky-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
        </a>
      )}

      {/* Compact form */}
      <form onSubmit={handleSubmit} className={`${cardBase} p-4 space-y-2.5`}>
        <div className="flex items-center gap-2 mb-1">
          <Send className="h-3.5 w-3.5 text-sky-500 dark:text-sky-400" />
          <h4 className="text-xs font-mono font-bold uppercase tracking-[0.15em] text-gray-700 dark:text-white/70">
            Drop a message
          </h4>
        </div>
        <input
          name="name"
          type="text"
          maxLength={100}
          required
          placeholder="Your name or company"
          aria-label="Your name"
          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-white/[0.03] text-sm text-gray-800 dark:text-white/85 placeholder:text-gray-400 dark:placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-sky-300 dark:focus:ring-sky-500/40 transition-all"
        />
        <textarea
          name="message"
          required
          maxLength={5000}
          placeholder="Tell me about your project, role, or just say hi..."
          aria-label="Your message"
          className="w-full min-h-[110px] px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-white/[0.03] text-sm text-gray-800 dark:text-white/85 placeholder:text-gray-400 dark:placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-sky-300 dark:focus:ring-sky-500/40 transition-all resize-none leading-relaxed"
        />
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={sending}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 dark:bg-sky-600 dark:hover:bg-sky-500 text-white text-xs font-medium transition-all hover:scale-[1.02] active:scale-100 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm shadow-sky-500/20"
          >
            {sending ? "Sending…" : "Send"}
            <Send className="h-3 w-3" />
          </button>
        </div>
      </form>
    </motion.div>
  );
}
