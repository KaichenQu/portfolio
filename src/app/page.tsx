import dynamic from "next/dynamic";
import Loading from "@/components/ui/Loading";

const Intro = dynamic(() => import("@/components/intro"), {
  loading: () => <Loading />,
});

const PostsPreview = dynamic(() => import("@/components/posts-preview"), {
  loading: () => <Loading />,
});

const Timeline = dynamic(() => import("@/components/timeline"), {
  loading: () => <Loading />,
});

const TimelineHorizontal = dynamic(
  () => import("@/components/timeline-horizontal"),
  { loading: () => <Loading /> }
);

export default function Home() {
  return (
    <main className="flex flex-col items-center pt-20 md:pt-28 px-4">
      <Intro />

      {/* Two-column: Posts (left) + Journey/Timeline (right) */}
      <section className="w-full max-w-5xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-2 gap-12">
        <PostsPreview />
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-gray-400 dark:text-white/30 font-mono mb-5">
            Journey
          </h2>
          <Timeline />
        </div>
      </section>

      {/* Horizontal timeline below */}
      <section className="w-full max-w-5xl mx-auto px-4 pb-20">
        <TimelineHorizontal />
      </section>
    </main>
  );
}
