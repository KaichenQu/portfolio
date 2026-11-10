import dynamic from "next/dynamic";
import Loading from "@/components/ui/Loading";
import About from "@/components/about";
import { pageMetadata } from "@/lib/seo";

const SkillMap = dynamic(() => import("@/components/skillmap"), {
  loading: () => <Loading />,
});

export const metadata = pageMetadata(
  "/about",
  "About",
  "Background, education and tech stack of Kelson Qu, a full-stack and AI engineer.",
);

export default function AboutPage() {
  return (
    <main className="flex flex-col items-center pt-20 md:pt-28 px-4 min-h-screen overflow-x-hidden">
      <About />
      <SkillMap />
    </main>
  );
}
