import {
  getIdentitySettings,
  getPublishedPostDiscoverySummaries,
} from "@/db/queries";
import { getServerEnv } from "@/lib/env";
import { resolveIdentity } from "@/lib/identity";
import { logServer } from "@/lib/logger";
import { toPublicArticleSummary } from "@/lib/writing/public-content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const baseUrl = getServerEnv().CANONICAL_SITE_URL.replace(/\/$/, "");
  try {
    const [settings, posts] = await Promise.all([
      getIdentitySettings(),
      getPublishedPostDiscoverySummaries(),
    ]);
    const identity = resolveIdentity(settings);
    const articles = posts.map((post) => toPublicArticleSummary(post, baseUrl));
    const articleLines = articles.length
      ? articles.map(
          (article) =>
            `- [${article.title}](${article.markdownUrl}): ${article.description}`,
        )
      : ["- No articles are currently published."];

    const body = [
      `# ${identity.name}`,
      "",
      `> ${identity.role}. ${identity.introduction.replace(/\s+/g, " ")}`,
      "",
      `Canonical site: ${baseUrl}`,
      "",
      "## Primary pages",
      "",
      `- [Portfolio](${baseUrl}/): Selected work, current focus, recognitions, and technology stack.`,
      `- [Projects](${baseUrl}/projects): Public project archive.`,
      `- [Writing](${baseUrl}/writing): Published articles and notes.`,
      "",
      "## Published writing",
      "",
      ...articleLines,
      "",
      "## Machine-readable indexes",
      "",
      `- [Published writing JSON](${baseUrl}/api/public/writing)`,
      `- [Sitemap](${baseUrl}/sitemap.xml)`,
      "",
      "Only public, published content is listed here. Admin data, drafts, MCP proposals, and private media are excluded.",
      "",
    ].join("\n");

    return new Response(body, {
      headers: {
        "Cache-Control": "public, max-age=0, must-revalidate",
        "Content-Type": "text/plain; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    logServer("error", "public.llms_failed", { error: String(error) });
    return new Response(
      "Public portfolio index is temporarily unavailable.\n",
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store",
          "Content-Type": "text/plain; charset=utf-8",
          "Retry-After": "60",
          "X-Content-Type-Options": "nosniff",
        },
      },
    );
  }
}
