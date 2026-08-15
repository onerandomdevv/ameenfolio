import { NextResponse } from "next/server";
import { z } from "zod";
import { clientKeyFromHeaders, createRateLimiter } from "@/lib/rate-limit";
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

/**
 * This endpoint is public and proxies WakaTime, so a client cycling ranges
 * turns into upstream calls: the cache is keyed by resolved range, and there
 * are hundreds of distinct weeks and months to walk through.
 *
 * The sibling status endpoint needs no such guard — a 60s cache and in-flight
 * dedupe hold it to roughly one upstream call a minute however often it is
 * asked.
 *
 * Set well above real use. Opening the page does not call this at all; it is
 * reached only by choosing a period in the history dialog, so a visitor
 * exploring their way through the calendar lands nowhere near thirty in a
 * minute.
 */
const checkRateLimit = createRateLimiter({ limit: 30, windowMs: 60_000 });

export async function GET(request: Request) {
  const rateLimit = checkRateLimit(clientKeyFromHeaders(request.headers));
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many history requests. Try again shortly." },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds),
          "Cache-Control": "no-store",
        },
      },
    );
  }

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
