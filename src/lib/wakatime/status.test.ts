import { describe, expect, it } from "vitest";
import {
  getWakaTimeHeartbeatDate,
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
        null,
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
        null,
        now,
      ),
    ).toEqual({
      isCoding: true,
      todayText: null,
      checkedAt: now.toISOString(),
    });
  });

  it("prefers the authoritative heartbeat feed over a stale profile value", () => {
    expect(
      toPublicWakaTimeStatus(
        { data: { last_heartbeat_at: "2026-08-09T10:00:00.000Z" } },
        { data: { grand_total: { text: "18 mins" } } },
        { data: [{ time: now.getTime() / 1_000 - 30 }] },
        now,
      ).isCoding,
    ).toBe(true);
  });

  it("formats the heartbeat query date in the account timezone", () => {
    expect(
      getWakaTimeHeartbeatDate(
        { data: { timezone: "Africa/Lagos" } },
        new Date("2026-08-09T23:30:00.000Z"),
      ),
    ).toBe("2026-08-10");
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
