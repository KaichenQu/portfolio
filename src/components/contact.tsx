"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useSectionInView } from "@/lib/useInView";
import SubmitBtn from "./submit-btn";
import { TextShimmerWave } from "./ui/text-shimmer-wave";
import { toast } from "react-hot-toast";

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
      <TextShimmerWave
        className="text-4xl [--base-color:#0D74CE] [--base-gradient-color:#5EB1EF] dark:text-white/60"
        duration={1.25}
        spread={0.7}
        zDistance={1}
        scaleDistance={1.1}
        rotateYDistance={20}
      >
        Contact Me
      </TextShimmerWave>

      <p className="mt-10 text-gray-700  dark:text-white/80">
        {"Feel free to contact me directly through this form"}
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-10 flex flex-col dark:text-black"
      >
        <input
          className="h-14 px-4 rounded-lg borderBlack dark:bg-white dark:bg-opacity-20 dark:focus:bg-opacity-10 transition-all dark:outline-none"
          name="senderEmail"
          type="email"
          required
          maxLength={500}
          placeholder={"Your email"}
        />
        <textarea
          className="h-52 my-3 rounded-lg resize-none borderBlack p-4 dark:bg-white dark:bg-opacity-20 dark:focus:bg-opacity-10 transition-all dark:outline-none"
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
