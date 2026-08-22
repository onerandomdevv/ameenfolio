import { getPublishedPostDiscoverySummaries } from "@/db/queries";
import { getServerEnv } from "@/lib/env";
import { logServer } from "@/lib/logger";
import { toPublicArticleSummary } from "@/lib/writing/public-content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const publicHeaders = {
  "Cache-Control": "public, max-age=0, must-revalidate",
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex, follow",
};

export async function GET() {
  try {
    const baseUrl = getServerEnv().CANONICAL_SITE_URL;
    const posts = await getPublishedPostDiscoverySummaries();
    return Response.json(
      {
        count: posts.length,
        articles: posts.map((post) => toPublicArticleSummary(post, baseUrl)),
      },
      { headers: publicHeaders },
    );
  } catch (error) {
    logServer("error", "public.writing_list_failed", { error: String(error) });
    return Response.json(
      { error: "Public writing is temporarily unavailable." },
      { status: 503, headers: { ...publicHeaders, "Retry-After": "60" } },
    );
  }
}
