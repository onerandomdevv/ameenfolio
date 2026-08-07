import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/server";
import { logServer } from "@/lib/logger";
import { deleteObject, signUpload } from "@/lib/storage/server";
import { isManagedObjectKey, validateUpload } from "@/lib/storage/rules";
import { uploadRequestSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  await requireAdmin();
  const parsed = uploadRequestSchema.safeParse(await request.json());
  if (
    !parsed.success ||
    !validateUpload(
      parsed.data.resourceType,
      parsed.data.contentType,
      parsed.data.size,
    )
  ) {
    return NextResponse.json(
      { error: "Invalid upload request." },
      { status: 400 },
    );
  }
  try {
    return NextResponse.json(
      await signUpload(parsed.data.resourceType, parsed.data.contentType),
    );
  } catch (error) {
    logServer("error", "storage.sign_failed", { error: String(error) });
    return NextResponse.json(
      { error: "Upload could not be signed." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  await requireAdmin();
  const body = (await request.json()) as { key?: unknown };
  if (typeof body.key !== "string" || !isManagedObjectKey(body.key)) {
    return NextResponse.json({ error: "Invalid object key." }, { status: 400 });
  }
  await deleteObject(body.key);
  return new NextResponse(null, { status: 204 });
}
