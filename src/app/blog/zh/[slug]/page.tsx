import NotePage, { noteMetadata } from "@/components/blog/note-page";
import { getNotes } from "@/lib/devlog";

export const dynamicParams = false;

export function generateStaticParams() {
  return getNotes({ locale: "zh-Hans" }).map((n) => ({ slug: n.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export function generateMetadata(props: Props) {
  return noteMetadata(props, "zh-Hans");
}

export default function Page(props: Props) {
  return <NotePage {...props} locale="zh-Hans" />;
}
