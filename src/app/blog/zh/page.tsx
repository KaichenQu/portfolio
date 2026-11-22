import BlogIndex, { indexMetadata } from "@/components/blog/blog-index";

export const metadata = indexMetadata("zh-Hans");

export default function Page() {
  return <BlogIndex locale="zh-Hans" />;
}
