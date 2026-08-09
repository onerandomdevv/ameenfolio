import { NextResponse } from "next/server";
import { getPublicWakaTimeStatus } from "@/lib/wakatime/server";

export const runtime = "nodejs";

export async function GET() {
  const status = await getPublicWakaTimeStatus();
  return NextResponse.json(status, {
    headers: {
      "Cache-Control":
        "public, max-age=30, s-maxage=60, stale-while-revalidate=120",
    },
  });
}
