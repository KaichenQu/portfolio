import Explorer from "@/components/blog/explorer";
import { getNotes, SECTIONS } from "@/lib/devlog";

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
    <div
      className={`mx-auto w-full max-w-7xl px-4 pb-16 pt-20 sm:px-6 md:pt-24${groups.length > 0 ? " lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-10" : ""}`}
    >
      {groups.length > 0 && (
        <aside className="mb-6 lg:mb-0">
          <div className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto lg:pr-1 scrollbar-hide">
            <Explorer groups={groups} />
          </div>
        </aside>
      )}
      <div className="min-w-0 lg:col-start-2">{children}</div>
    </div>
  );
}
