import { getPublicPortfolio } from "@/db/queries";
import { getObject } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { settings } = await getPublicPortfolio();
  if (!settings.resumeKey) return new Response("Resume not available", { status: 404 });
  try {
    const object = await getObject(settings.resumeKey);
    if (!object.Body) return new Response("Resume not available", { status: 404 });
    const filename = (settings.resumeFilename ?? "Ameen-Resume.pdf").replaceAll('"', "");
    return new Response(object.Body.transformToWebStream(), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Resume not available", { status: 404 });
  }
}
