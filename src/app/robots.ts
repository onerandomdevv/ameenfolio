import type { MetadataRoute } from "next";
import { getServerEnv } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const base = getServerEnv().CANONICAL_SITE_URL;
  return { rules: [{ userAgent: "*", allow: ["/", "/projects"], disallow: ["/admin", "/api"] }], sitemap: `${base}/sitemap.xml` };
}
