import About from "@/components/about";
import SkillMap from "@/components/skillmap";

export default function AboutPage() {
  return (
    <main className="flex flex-col items-center px-4 min-h-screen overflow-x-hidden">
      <About />
      <SkillMap />
    </main>
  );
}
