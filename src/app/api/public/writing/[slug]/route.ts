import { getPublishedPost } from "@/db/queries";
import { getServerEnv } from "@/lib/env";
import { logServer } from "@/lib/logger";
import { toPublicArticle } from "@/lib/writing/public-content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const publicHeaders = {
  "Cache-Control": "public, max-age=0, must-revalidate",
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex, follow",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  try {
    const found = await getPublishedPost(slug);
    if (!found) {
      return Response.json(
        { error: "Published article not found." },
        { status: 404, headers: publicHeaders },
      );
    }

    return Response.json(
      toPublicArticle(
        found.post,
        found.links,
        getServerEnv().CANONICAL_SITE_URL,
      ),
      { headers: publicHeaders },
    );
  } catch (error) {
    logServer("error", "public.writing_item_failed", {
      slug,
      error: String(error),
    });
    return Response.json(
      { error: "The published article is temporarily unavailable." },
      { status: 503, headers: { ...publicHeaders, "Retry-After": "60" } },
    );
  }
}
