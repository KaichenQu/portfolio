import TagPage, { tagMetadata, tagParams } from "@/components/blog/tag-page";

export const dynamicParams = false;

export function generateStaticParams() {
  return tagParams();
}

type Props = { params: Promise<{ tag: string }> };

export function generateMetadata(props: Props) {
  return tagMetadata(props, "zh-Hans");
}

export default function Page(props: Props) {
  return <TagPage {...props} locale="zh-Hans" />;
}
