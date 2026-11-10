import Contact from "@/components/contact";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(
  "/contact",
  "Contact",
  "Get in touch with Kelson Qu about full-stack and AI engineering work.",
);

export default function ContactPage() {
  return (
    <main className="flex flex-col items-center pt-20 md:pt-28 px-4">
      <h1 className="sr-only">Contact</h1>
      <Contact />
    </main>
  );
}
