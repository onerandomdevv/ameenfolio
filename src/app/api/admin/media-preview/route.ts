import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/server";
import { getObject } from "@/lib/storage/server";
import { isManagedObjectKey } from "@/lib/storage/rules";

export const runtime = "nodejs";

export async function GET(request: Request) {
  await requireAdmin();
  const key = new URL(request.url).searchParams.get("key");
  if (!key || !isManagedObjectKey(key)) {
    return NextResponse.json({ error: "Invalid media key." }, { status: 400 });
  }
  try {
    const object = await getObject(key);
    if (!object.Body) return new NextResponse("Not found", { status: 404 });
    return new Response(object.Body.transformToWebStream(), {
      headers: {
        "Content-Type": object.ContentType ?? "application/octet-stream",
        "Cache-Control": "private, max-age=300",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
