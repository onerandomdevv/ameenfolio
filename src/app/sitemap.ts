import type { MetadataRoute } from "next";
import { getPublishedPostSummaries } from "@/db/queries";
import { getServerEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getServerEnv().CANONICAL_SITE_URL.replace(/\/$/, "");
  const fixed: MetadataRoute.Sitemap = [
    { url: `${base}`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/projects`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/writing`, changeFrequency: "weekly", priority: 0.8 },
  ];

  // Posts are the only pages here with their own addresses, so they are the
  // only ones worth enumerating. A database that is unreachable leaves the
  // fixed entries rather than failing the whole sitemap.
  let posts: MetadataRoute.Sitemap = [];
  try {
    const summaries = await getPublishedPostSummaries();
    posts = summaries.map((post) => ({
      url: `${base}/writing/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));
  } catch {
    posts = [];
  }

  return [...fixed, ...posts];
}
