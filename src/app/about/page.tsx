import dynamic from "next/dynamic";
import Loading from "@/components/ui/Loading";

// Dynamically import components
const About = dynamic(() => import("@/components/about"), {
  loading: () => <Loading />,
});

const SkillMap = dynamic(() => import("@/components/skillmap"), {
  loading: () => <Loading />,
});

const LearningProgress = dynamic(
  () => import("@/components/learningprogress"),
  {
    loading: () => <Loading />,
  }
);

export default function AboutPage() {
  return (
    <main className="flex flex-col items-center px-4 min-h-screen overflow-x-hidden">
      <About />
      <SkillMap />
    </main>
  );
}
