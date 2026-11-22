import BlogIndex, { indexMetadata } from "@/components/blog/blog-index";

export const metadata = indexMetadata("en");

export default function Page() {
  return <BlogIndex locale="en" />;
}
