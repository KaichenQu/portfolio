import type { Metadata } from "next";

export const SITE_URL = "https://www.kelsonqu.com";

export const JOB_TITLE = "Full-Stack & AI Engineer";

type OpenGraph = NonNullable<Metadata["openGraph"]>;

/**
 * Metadata for one route. A page's `openGraph` and `twitter` replace the root
 * objects instead of merging, so each route restates them with its own URL and title.
 */
export function pageMetadata(
  path: string,
  title: string,
  description: string,
  openGraph: OpenGraph = { type: "website" },
): Metadata {
  const fullTitle = `${title} | Kelson Qu`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      siteName: "Kelson Qu Portfolio",
      locale: "en_US",
      url: path,
      title: fullTitle,
      description,
      ...openGraph,
    },
    twitter: { card: "summary_large_image", title: fullTitle, description },
  };
}

export const siteJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": `${SITE_URL}/#person`,
      name: "Kelson Qu",
      url: SITE_URL,
      jobTitle: JOB_TITLE,
      alumniOf: {
        "@type": "CollegeOrUniversity",
        name: "Northeastern University",
      },
      sameAs: [
        "https://github.com/KaichenQu",
        "https://www.linkedin.com/in/kelsonqu/",
      ],
      knowsAbout: [
        "LLM agents",
        "Full-stack web development",
        "Distributed systems",
        "Java",
        "Python",
        "TypeScript",
        "Go",
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: "Kelson Qu",
      url: SITE_URL,
      publisher: { "@id": `${SITE_URL}/#person` },
    },
  ],
};
