import { describe, expect, it } from "vitest";
import {
  isPublicWakaTimeStatus,
  isRecentWakaTimeHeartbeat,
  toPublicWakaTimeStatus,
} from "@/lib/wakatime/status";

const now = new Date("2026-08-09T12:00:00.000Z");

describe("WakaTime public status", () => {
  it("treats a heartbeat within five minutes as active", () => {
    expect(
      isRecentWakaTimeHeartbeat("2026-08-09T11:56:00.000Z", now.getTime()),
    ).toBe(true);
    expect(
      isRecentWakaTimeHeartbeat("2026-08-09T11:54:59.000Z", now.getTime()),
    ).toBe(false);
  });

  it("rejects invalid and implausibly future heartbeats", () => {
    expect(isRecentWakaTimeHeartbeat("not-a-date", now.getTime())).toBe(false);
    expect(
      isRecentWakaTimeHeartbeat("2026-08-09T12:02:00.000Z", now.getTime()),
    ).toBe(false);
  });

  it("returns only the public coding signal and today's total", () => {
    expect(
      toPublicWakaTimeStatus(
        { data: { last_heartbeat_at: "2026-08-09T11:58:00.000Z" } },
        { data: { grand_total: { text: "3 hrs 24 mins" } } },
        now,
      ),
    ).toEqual({
      isCoding: true,
      todayText: "3 hrs 24 mins",
      checkedAt: now.toISOString(),
    });
  });

  it("does not fail the live signal when today's summary is unavailable", () => {
    expect(
      toPublicWakaTimeStatus(
        { data: { last_heartbeat_at: "2026-08-09T11:58:00.000Z" } },
        null,
        now,
      ),
    ).toEqual({
      isCoding: true,
      todayText: null,
      checkedAt: now.toISOString(),
    });
  });

  it("validates the sanitized browser response shape", () => {
    expect(
      isPublicWakaTimeStatus({
        isCoding: false,
        todayText: null,
        checkedAt: now.toISOString(),
      }),
    ).toBe(true);
    expect(isPublicWakaTimeStatus({ isCoding: "yes" })).toBe(false);
  });
});
