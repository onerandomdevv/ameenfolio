import { NextResponse } from "next/server";
import { decideAssistantApproval } from "@/lib/ai/approvals";
import { requireAdmin } from "@/lib/auth/server";
import {
  assistantDecisionSchema,
  assistantThreadIdSchema,
} from "@/lib/ai/validation";
import { logServer } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: RouteContext<"/api/admin/assistant/approvals/[id]">,
) {
  await requireAdmin();
  const id = assistantThreadIdSchema.safeParse((await context.params).id);
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid decision." }, { status: 400 });
  }
  const body = assistantDecisionSchema.safeParse(raw);
  if (!id.success || !body.success) {
    return NextResponse.json({ error: "Invalid decision." }, { status: 400 });
  }

  try {
    const approval = await decideAssistantApproval(id.data, body.data.decision);
    return NextResponse.json({ approval });
  } catch (error) {
    logServer("error", "assistant.approval_failed", {
      approvalId: id.data,
      error: String(error),
    });
    return NextResponse.json(
      { error: "The approval could not be applied." },
      { status: 409 },
    );
  }
}
