import NotePage, { noteMetadata } from "@/components/blog/note-page";
import { getNotes } from "@/lib/devlog";

export const dynamicParams = false;

export function generateStaticParams() {
  return getNotes({ locale: "en" }).map((n) => ({ slug: n.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export function generateMetadata(props: Props) {
  return noteMetadata(props, "en");
}

export default function Page(props: Props) {
  return <NotePage {...props} locale="en" />;
}
