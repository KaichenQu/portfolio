import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Loading from "@/components/ui/Loading";
import About from "@/components/about";

const SkillMap = dynamic(() => import("@/components/skillmap"), {
  loading: () => <Loading />,
});

export const metadata: Metadata = {
  title: "About",
  description:
    "Background, education and tech stack of Kelson Qu, a full-stack and AI engineer.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <main className="flex flex-col items-center pt-20 md:pt-28 px-4 min-h-screen overflow-x-hidden">
      <About />
      <SkillMap />
    </main>
  );
}
