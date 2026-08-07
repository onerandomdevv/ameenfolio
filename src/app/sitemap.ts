import type { MetadataRoute } from "next";
import { getServerEnv } from "@/lib/env";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getServerEnv().CANONICAL_SITE_URL;
  return ["", "/projects"].map((path) => ({
    url: `${base}${path}`,
    changeFrequency: "monthly",
    priority: path ? 0.8 : 1,
  }));
}
