import { getObject } from "@/lib/storage";
import { isPublicIconKey } from "@/lib/storage-rules";
import { isReferencedPublicIcon } from "@/db/queries";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const key = (await params).key.join("/");
  if (!isPublicIconKey(key) || !(await isReferencedPublicIcon(key))) {
    return new Response("Not found", { status: 404 });
  }
  try {
    const object = await getObject(key);
    if (!object.Body) return new Response("Not found", { status: 404 });
    return new Response(object.Body.transformToWebStream(), {
      headers: {
        "Content-Type": object.ContentType ?? "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
