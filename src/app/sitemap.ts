import { MetadataRoute } from "next";
import { tagParams } from "@/components/blog/tag-page";
import { getNotes } from "@/lib/devlog";
import { blogPath } from "@/lib/blog-locale";
import { SITE_URL as baseUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const tags = tagParams();
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
    ...tags.map(({ tag }) => ({
      url: baseUrl + blogPath("en", `/tags/${encodeURIComponent(tag)}`),
      priority: 0.3,
    })),
    {
      url: baseUrl + blogPath("zh-Hans"),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...getNotes({ locale: "zh-Hans" }).map((n) => ({
      url: baseUrl + blogPath("zh-Hans", `/${n.slug}`),
      ...(n.date && { lastModified: n.date }),
      priority: 0.6,
    })),
    ...tags.map(({ tag }) => ({
      url: baseUrl + blogPath("zh-Hans", `/tags/${encodeURIComponent(tag)}`),
      priority: 0.3,
    })),
  ];
}
