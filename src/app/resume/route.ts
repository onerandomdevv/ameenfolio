import { getPublicPortfolio } from "@/db/queries";
import { getObject } from "@/lib/storage/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // The public button downloads; the admin's "View file" wants the browser's
  // PDF viewer instead, which is the disposition rather than a second route.
  const inline = new URL(request.url).searchParams.get("inline") === "1";
  const { settings } = await getPublicPortfolio();
  if (!settings.resumeKey)
    return new Response("Resume not available", { status: 404 });
  try {
    const object = await getObject(settings.resumeKey);
    if (!object.Body)
      return new Response("Resume not available", { status: 404 });
    const filename = (settings.resumeFilename ?? "Ameen-Resume.pdf").replaceAll(
      '"',
      "",
    );
    return new Response(object.Body.transformToWebStream(), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${filename}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        // The inline view is sandboxed by a Content-Security-Policy rule in
        // next.config.ts, not here: headers from that config replace a Route
        // Handler's own header of the same name.
      },
    });
  } catch {
    return new Response("Resume not available", { status: 404 });
  }
}
