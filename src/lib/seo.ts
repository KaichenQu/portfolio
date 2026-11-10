export const SITE_URL = "https://www.kelsonqu.com";

export const JOB_TITLE = "Full-Stack & AI Engineer";

export const siteJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": `${SITE_URL}/#person`,
      name: "Kelson Qu",
      url: SITE_URL,
      jobTitle: JOB_TITLE,
      alumniOf: { "@type": "CollegeOrUniversity", name: "Northeastern University" },
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
