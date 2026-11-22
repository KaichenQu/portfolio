import BlogLayout from "@/components/blog/blog-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <BlogLayout locale="zh-Hans">{children}</BlogLayout>;
}
