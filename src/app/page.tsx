import dynamic from "next/dynamic";
import Loading from "@/components/ui/Loading";

// Lazy loading the Intro component
const Intro = dynamic(() => import("@/components/intro"), {
  loading: () => <Loading />,
});

export default function Home() {
  return (
    <main className="flex flex-col items-center pt-20 md:pt-28 px-4">
      <Intro />
    </main>
  );
}
