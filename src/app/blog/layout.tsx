import Image from "next/image";
import NextLink from "next/link";
import Explorer from "@/components/blog/explorer";
import SidebarNav from "@/components/sidebar-nav";
import { getNotes, SECTIONS } from "@/lib/devlog";
import { JOB_TITLE } from "@/lib/seo";

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const notes = getNotes();
  const groups = SECTIONS.map(([, section]) => ({
    section,
    notes: notes
      .filter((n) => n.section === section)
      .map(({ slug, title, tags }) => ({ slug, title, tags })),
  })).filter((g) => g.notes.length > 0);

  return (
    <div className="mx-auto w-full max-w-screen-xl px-6 pb-16 pt-4 lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-10 lg:px-20 lg:pt-14">
      <aside className="mb-6 lg:mb-0">
        {/* -m-1 p-1 keeps focus outlines inside the scrolling box. */}
        <div className="lg:sticky lg:top-14 lg:-m-1 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:p-1 scrollbar-hide">
          <NextLink href="/" className="flex items-center gap-3 rounded-lg">
            <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-white ring-2 ring-sky-400/50 ring-offset-2 ring-offset-gray-50 dark:bg-gray-800 dark:ring-offset-gray-900">
              <Image
                src="/boy.png"
                alt=""
                fill
                sizes="40px"
                className="object-cover object-center scale-110"
              />
            </span>
            <span className="min-w-0">
              <span className="block text-[15px] font-bold leading-tight tracking-[-0.01em] text-gray-900 dark:text-white">
                Kelson Qu
              </span>
              <span className="mt-0.5 block font-mono text-[11px] uppercase leading-snug tracking-[0.18em] text-sky-700 dark:text-sky-400">
                {JOB_TITLE}
              </span>
            </span>
          </NextLink>
          <SidebarNav active="/blog" />
          {groups.length > 0 && (
            <>
              <hr className="my-6 hidden border-gray-200 lg:block dark:border-white/10" />
              <div className="mt-6 lg:mt-0">
                <Explorer groups={groups} />
              </div>
            </>
          )}
        </div>
      </aside>
      <div className="min-w-0 lg:col-start-2">{children}</div>
    </div>
  );
}
