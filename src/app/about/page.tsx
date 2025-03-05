import dynamic from "next/dynamic";

// Dynamically import components
const About = dynamic(() => import("@/components/about"), {
  loading: () => <div>Loading...</div>,
});

const SkillMap = dynamic(() => import("@/components/skillmap"), {
  loading: () => <div>Loading...</div>,
});

export default function AboutPage() {
  return (
    <main className="flex flex-col items-center px-4 min-h-screen overflow-x-hidden">
      <About />
      <SkillMap />
    </main>
  );
}
