import React from "react";
import { FaPaperPlane } from "react-icons/fa";
import { useFormStatus } from "react-dom";

type SubmitBtnProps = {
  text: string;
};
export default function SubmitBtn({ text }: SubmitBtnProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className="group flex items-center justify-center gap-2 px-6 h-[2.75rem] bg-pink-500 hover:bg-pink-600 dark:bg-pink-500/90 dark:hover:bg-pink-500 text-white text-sm font-medium rounded-xl outline-none transition-all hover:scale-[1.03] active:scale-100 disabled:opacity-60 disabled:scale-100 disabled:cursor-not-allowed whitespace-nowrap"
      disabled={pending}
    >
      {pending ? (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      ) : (
        <>
          {text}
          <FaPaperPlane className="text-xs opacity-80 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </>
      )}
    </button>
  );
}
