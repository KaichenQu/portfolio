import dynamic from "next/dynamic";
import Loading from "@/components/ui/Loading";

const ProjectsContainer = dynamic(
  () => import("@/components/projects-container"),
  {
    loading: () => <Loading />,
  }
);

// ─── UNDER CONSTRUCTION ───────────────────────────────────────────────────────
// To remove: delete the <UnderConstruction /> line below and this entire function.
function UnderConstruction() {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden select-none">
      {Array.from({ length: 6 }).map((_, row) =>
        Array.from({ length: 4 }).map((_, col) => (
          <div
            key={`${row}-${col}`}
            className="absolute font-mono font-semibold uppercase text-gray-400/20 dark:text-white/[0.055] whitespace-nowrap"
            style={{
              fontSize: "13px",
              left: `${col * 28 - 6}%`,
              top: `${row * 18 - 4}%`,
              transform: "rotate(-35deg)",
              letterSpacing: "0.18em",
            }}
          >
            Under Construction
          </div>
        ))
      )}
      {/* Corner badge — pointer-events re-enabled so it's visible but not blocking */}
      <div className="pointer-events-auto fixed bottom-6 right-6 flex items-center gap-2 rounded-full border border-amber-300/50 bg-amber-50/90 dark:bg-amber-900/25 dark:border-amber-500/30 px-3.5 py-1.5 backdrop-blur-sm shadow-sm">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-70" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400" />
        </span>
        <span className="text-[11px] font-mono font-medium text-amber-700 dark:text-amber-400 tracking-wide">
          Under Construction
        </span>
      </div>
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

export default function ProjectsPage() {
  return (
    <main className="flex flex-col items-center pt-20 md:pt-28 px-4">
      <UnderConstruction />
      <ProjectsContainer />
    </main>
  );
}
