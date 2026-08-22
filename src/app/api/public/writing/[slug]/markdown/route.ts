import { getPublishedPost } from "@/db/queries";
import { getServerEnv } from "@/lib/env";
import { logServer } from "@/lib/logger";
import {
  articleAsMarkdown,
  toPublicArticle,
} from "@/lib/writing/public-content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const baseUrl = getServerEnv().CANONICAL_SITE_URL;
  const canonicalUrl = new URL(`/writing/${slug}`, baseUrl).toString();
  const headers = {
    "Cache-Control": "public, max-age=0, must-revalidate",
    "Content-Type": "text/markdown; charset=utf-8",
    Link: `<${canonicalUrl}>; rel="canonical"`,
    "X-Content-Type-Options": "nosniff",
    "X-Robots-Tag": "noindex, follow",
  };

  try {
    const found = await getPublishedPost(slug);
    if (!found) {
      return new Response("Published article not found.\n", {
        status: 404,
        headers,
      });
    }

    const article = toPublicArticle(found.post, found.links, baseUrl);
    return new Response(articleAsMarkdown(article), { headers });
  } catch (error) {
    logServer("error", "public.writing_markdown_failed", {
      slug,
      error: String(error),
    });
    return new Response("The published article is temporarily unavailable.\n", {
      status: 503,
      headers: { ...headers, "Retry-After": "60" },
    });
  }
}
