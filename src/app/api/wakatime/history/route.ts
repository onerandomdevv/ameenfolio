import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getPublicWakaTimeHistory,
  getPublicWakaTimeStatus,
} from "@/lib/wakatime/server";
import {
  getWakaTimeHistoryRange,
  wakaTimeHistoryModeSchema,
} from "@/lib/wakatime/status";

export const runtime = "nodejs";

const historyQuerySchema = z.object({
  mode: wakaTimeHistoryModeSchema,
  anchor: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = historyQuerySchema.safeParse({
    mode: url.searchParams.get("mode"),
    anchor: url.searchParams.get("anchor"),
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Choose a valid history period." },
      { status: 400 },
    );
  }

  // Outside the try below this would escape as a bare 500 with an HTML body,
  // and the client parses every failure as JSON. getServerEnv() throws on a
  // failed parse and is reached from here, so the path is real.
  let todayDate = new Date().toISOString().slice(0, 10);
  try {
    const status = await getPublicWakaTimeStatus();
    todayDate = status.todayDate ?? todayDate;
  } catch {
    return NextResponse.json(
      { error: "Coding history is temporarily unavailable." },
      { status: 502 },
    );
  }

  const range = getWakaTimeHistoryRange(
    parsed.data.mode,
    parsed.data.anchor,
    todayDate,
  );
  if (!range) {
    return NextResponse.json(
      { error: "That history period is unavailable." },
      { status: 400 },
    );
  }

  try {
    const history = await getPublicWakaTimeHistory(
      parsed.data.mode,
      range.startDate,
      range.endDate,
    );
    return NextResponse.json(history, {
      headers: {
        "Cache-Control":
          range.endDate < todayDate
            ? "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400"
            : "public, max-age=30, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Coding history is temporarily unavailable." },
      { status: 502 },
    );
  }
}
