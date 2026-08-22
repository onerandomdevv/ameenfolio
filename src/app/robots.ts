import type { MetadataRoute } from "next";
import { getServerEnv } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const base = getServerEnv().CANONICAL_SITE_URL.replace(/\/$/, "");
  const privatePaths = ["/admin", "/api", "/.well-known"];
  return {
    rules: [
      {
        userAgent: [
          "OAI-SearchBot",
          "ChatGPT-User",
          "Claude-SearchBot",
          "Claude-User",
        ],
        allow: ["/", "/api/public/"],
        disallow: privatePaths,
      },
      // Search/retrieval access is independent from model-training access.
      // Keep these policies explicit so enabling one never silently enables
      // the other.
      {
        userAgent: ["GPTBot", "ClaudeBot"],
        disallow: "/",
      },
      {
        userAgent: "*",
        allow: ["/", "/api/public/"],
        disallow: privatePaths,
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
