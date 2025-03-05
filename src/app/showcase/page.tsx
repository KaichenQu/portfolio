import dynamic from "next/dynamic";

const ProjectsContainer = dynamic(
  () => import("@/components/projects-container"),
  {
    loading: () => <div>Loading...</div>,
  }
);

export default function ProjectsPage() {
  return (
    <main className="flex flex-col items-center pt-20 md:pt-28 px-4">
      <ProjectsContainer />
    </main>
  );
}
