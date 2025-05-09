import { NotFound404 } from "@/components/common/404";
import Loading from "@/components/ui/Loading";

export default function BlogPage() {
  return (
    <main className="flex flex-col items-center pt-20 md:pt-28 px-4">
      <NotFound404 />
      <Loading />
    </main>
  );
}
