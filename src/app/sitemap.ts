import { MetadataRoute } from "next";
import { getNotes, getTags } from "@/lib/devlog";
import { SITE_URL as baseUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: baseUrl,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/showcase`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/blog`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...getNotes().map((n) => ({
      url: `${baseUrl}/blog/${n.slug}`,
      ...(n.date && { lastModified: n.date }),
      priority: 0.6,
    })),
    ...getTags().map(({ tag }) => ({
      url: `${baseUrl}/blog/tags/${tag}`,
      priority: 0.3,
    })),
  ];
}
