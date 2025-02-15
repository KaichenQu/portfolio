"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useSectionInView } from "@/lib/useInView";
import SubmitBtn from "./submit-btn";
import { TextShimmerWave } from "./ui/text-shimmer-wave";
import { toast } from "react-hot-toast";
import SectionTitle from "./common/sectiontitle";

export default function Contact() {
  const { ref } = useSectionInView("#contact");
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const senderEmail = formData.get("senderEmail");
    const message = formData.get("message");

    try {
      setPending(true);
      const res = await fetch("/api/send", {
        method: "POST",
        body: JSON.stringify({
          senderEmail,
          message,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to send message");
      }

      (e.target as HTMLFormElement).reset();
      toast.success("Message sent successfully!");
    } catch (error) {
      toast.error("Something went wrong!");
    } finally {
      setPending(false);
    }
  }

  return (
    <motion.section
      id="contact"
      ref={ref}
      className="mt-10 mb-20 sm:mb-28 scroll-mt-28 w-[min(100%,38rem)] text-center"
      initial={{
        opacity: 0,
      }}
      whileInView={{
        opacity: 1,
      }}
      transition={{
        duration: 1,
      }}
      viewport={{
        once: true,
      }}
    >
      <SectionTitle>Contact Me</SectionTitle>

      <p className="mt-10 text-gray-700 dark:text-white/80">
        {"Feel free to contact me directly through this form"}
      </p>

      <form onSubmit={handleSubmit} className="mt-10 flex flex-col">
        <input
          className="h-14 px-4 rounded-lg borderBlack bg-white dark:bg-white/10 dark:text-white/80 transition-all dark:outline-none"
          name="senderEmail"
          type="email"
          required
          maxLength={500}
          placeholder={"Your email"}
        />
        <textarea
          className="h-56 my-3 rounded-lg resize-none borderBlack p-4 bg-white dark:bg-white/10 dark:text-white/80 transition-all dark:outline-none"
          name="message"
          placeholder={"Message"}
          required
          maxLength={5000}
        />
        <SubmitBtn text={"Submit"} />
      </form>
    </motion.section>
  );
}
