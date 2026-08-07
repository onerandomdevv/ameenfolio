import { getAuth } from "@/lib/auth/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const handlers = () => getAuth().handler();

export async function GET(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  return handlers().GET(request, context);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  return handlers().POST(request, context);
}
