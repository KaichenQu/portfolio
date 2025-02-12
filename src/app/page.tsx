import About from "@/components/about";
import { NotFound404 } from "@/components/common/404";
import Intro from "@/components/intro";
import Projects from "@/components/projects";
import SkillMap from "@/components/skillmap";

export default function Home() {
  return (
    <main className="flex flex-col items-center pt-20 md:pt-28 px-4">
      <Intro />
      <About />
      <Projects />
      <SkillMap />
    </main>
  );
}
