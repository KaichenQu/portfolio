import dynamic from "next/dynamic";
import Loading from "@/components/ui/Loading";

const ProjectsContainer = dynamic(
  () => import("@/components/projects-container"),
  {
    loading: () => <Loading />,
  }
);

export default function ProjectsPage() {
  return (
    <main className="flex flex-col items-center pt-20 md:pt-28 px-4">
      <ProjectsContainer />
    </main>
  );
}
