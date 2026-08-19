import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/server";
import {
  deleteAssistantThread,
  getAssistantThread,
  renameAssistantThread,
  setAssistantThreadPinned,
} from "@/lib/ai/repository";
import {
  assistantThreadIdSchema,
  assistantThreadMutationSchema,
} from "@/lib/ai/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/admin/assistant/threads/[id]">,
) {
  await requireAdmin();
  const parsed = assistantThreadIdSchema.safeParse((await context.params).id);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid thread." }, { status: 400 });
  }
  const thread = await getAssistantThread(parsed.data);
  if (!thread) {
    return NextResponse.json({ error: "Thread not found." }, { status: 404 });
  }
  return NextResponse.json(thread, {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/admin/assistant/threads/[id]">,
) {
  await requireAdmin();
  const parsed = assistantThreadIdSchema.safeParse((await context.params).id);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid thread." }, { status: 400 });
  }
  const deleted = await deleteAssistantThread(parsed.data);
  return deleted
    ? new NextResponse(null, { status: 204 })
    : NextResponse.json({ error: "Thread not found." }, { status: 404 });
}

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/admin/assistant/threads/[id]">,
) {
  await requireAdmin();
  const id = assistantThreadIdSchema.safeParse((await context.params).id);
  if (!id.success) {
    return NextResponse.json({ error: "Invalid thread." }, { status: 400 });
  }
  const input = assistantThreadMutationSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!input.success) {
    return NextResponse.json(
      { error: "The conversation change is invalid." },
      { status: 400 },
    );
  }

  const thread =
    input.data.action === "rename"
      ? await renameAssistantThread(id.data, input.data.title)
      : await setAssistantThreadPinned(id.data, input.data.pinned);
  return thread
    ? NextResponse.json(thread, { headers: { "Cache-Control": "no-store" } })
    : NextResponse.json({ error: "Thread not found." }, { status: 404 });
}
