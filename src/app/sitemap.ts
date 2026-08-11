import type { MetadataRoute } from "next";
import { getPublishedPostSummaries } from "@/db/queries";
import { getServerEnv } from "@/lib/env";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getServerEnv().CANONICAL_SITE_URL;
  const fixed = ["", "/projects", "/writing"].map((path) => ({
    url: `${base}${path}`,
    changeFrequency: "monthly" as const,
    priority: path ? 0.8 : 1,
  }));

  // Posts are the only pages here with their own addresses, so they are the
  // only ones worth enumerating. A database that is unreachable leaves the
  // fixed entries rather than failing the whole sitemap.
  let posts: MetadataRoute.Sitemap = [];
  try {
    const summaries = await getPublishedPostSummaries();
    posts = summaries.map((post) => ({
      url: `${base}/writing/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: "yearly" as const,
      priority: 0.6,
    }));
  } catch {
    posts = [];
  }

  return [...fixed, ...posts];
}
