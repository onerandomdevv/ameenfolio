import { describe, expect, it } from "vitest";
import {
  getWakaTimeHeartbeatDate,
  getWakaTimeHistoryRange,
  getSundayWeekDates,
  isPublicWakaTimeHistory,
  isPublicWakaTimeStatus,
  isRecentWakaTimeHeartbeat,
  retainLastKnownWakaTimeStats,
  toPublicWakaTimeHistory,
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
    expect(
      isRecentWakaTimeHeartbeat("2026-08-09T11:55:00.000Z", now.getTime()),
    ).toBe(true);
  });

  it("rejects invalid and implausibly future heartbeats", () => {
    expect(isRecentWakaTimeHeartbeat("not-a-date", now.getTime())).toBe(false);
    expect(
      isRecentWakaTimeHeartbeat("2026-08-09T12:02:00.000Z", now.getTime()),
    ).toBe(false);
  });

  it("returns a sanitized status when weekly activity is unavailable", () => {
    expect(
      toPublicWakaTimeStatus(
        { data: { last_heartbeat_at: "2026-08-09T11:58:00.000Z" } },
        { data: { grand_total: { text: "3 hrs 24 mins" } } },
        null,
        null,
        now,
      ),
    ).toEqual({
      isCoding: true,
      statsStale: true,
      todayDate: "2026-08-09",
      todayText: "3 hrs 24 mins",
      todaySeconds: null,
      weekSeconds: null,
      dailyAverageSeconds: null,
      topLanguage: null,
      days: [],
      lastActiveAt: "2026-08-09T11:58:00.000Z",
      checkedAt: now.toISOString(),
    });
  });

  it("does not fail the live signal when today's summary is unavailable", () => {
    expect(
      toPublicWakaTimeStatus(
        { data: { last_heartbeat_at: "2026-08-09T11:58:00.000Z" } },
        null,
        null,
        null,
        now,
      ),
    ).toEqual({
      isCoding: true,
      statsStale: true,
      todayDate: "2026-08-09",
      todayText: null,
      todaySeconds: null,
      weekSeconds: null,
      dailyAverageSeconds: null,
      topLanguage: null,
      days: [],
      lastActiveAt: "2026-08-09T11:58:00.000Z",
      checkedAt: now.toISOString(),
    });
  });

  it("prefers the authoritative heartbeat feed over a stale profile value", () => {
    expect(
      toPublicWakaTimeStatus(
        { data: { last_heartbeat_at: "2026-08-09T10:00:00.000Z" } },
        { data: { grand_total: { text: "18 mins" } } },
        { data: [{ time: now.getTime() / 1_000 - 30 }] },
        null,
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

  it("orders a calendar week from Sunday through Saturday", () => {
    expect(getSundayWeekDates("2026-08-09")).toEqual([
      "2026-08-09",
      "2026-08-10",
      "2026-08-11",
      "2026-08-12",
      "2026-08-13",
      "2026-08-14",
      "2026-08-15",
    ]);
  });

  it("builds Sunday-first week and calendar-month history ranges", () => {
    expect(getWakaTimeHistoryRange("week", "2026-08-12", "2026-08-14")).toEqual(
      {
        startDate: "2026-08-09",
        endDate: "2026-08-14",
      },
    );
    expect(
      getWakaTimeHistoryRange("month", "2026-07-18", "2026-08-14"),
    ).toEqual({
      startDate: "2026-07-01",
      endDate: "2026-07-31",
    });
    expect(
      getWakaTimeHistoryRange("week", "2026-08-15", "2026-08-14"),
    ).toBeNull();
  });

  it("sanitizes historical daily totals and languages", () => {
    const history = toPublicWakaTimeHistory(
      {
        data: [
          {
            range: { date: "2026-08-02" },
            grand_total: { total_seconds: 3_600 },
            languages: [
              { name: "TypeScript", total_seconds: 2_700 },
              { name: "Markdown", total_seconds: 900 },
            ],
            projects: [{ name: "private-project" }],
          },
          {
            range: { date: "2026-08-03" },
            grand_total: { total_seconds: 7_200 },
            languages: [{ name: "JavaScript", total_seconds: 7_200 }],
          },
        ],
      },
      "week",
      "2026-08-02",
      "2026-08-08",
    );

    expect(history).toMatchObject({
      mode: "week",
      startDate: "2026-08-02",
      endDate: "2026-08-08",
      totalSeconds: 10_800,
      dailyAverageSeconds: 5_400,
      topLanguage: { name: "JavaScript", percent: 73 },
    });
    expect(history.days).toHaveLength(7);
    expect(isPublicWakaTimeHistory(history)).toBe(true);
    expect(JSON.stringify(history)).not.toContain("private-project");
  });

  it("validates the sanitized browser response shape", () => {
    expect(
      isPublicWakaTimeStatus({
        isCoding: false,
        statsStale: false,
        todayDate: "2026-08-09",
        todayText: null,
        todaySeconds: 0,
        weekSeconds: 0,
        dailyAverageSeconds: 0,
        topLanguage: null,
        days: [],
        lastActiveAt: null,
        checkedAt: now.toISOString(),
      }),
    ).toBe(true);
    expect(isPublicWakaTimeStatus({ isCoding: "yes" })).toBe(false);
  });

  it("summarizes only privacy-safe weekly activity", () => {
    expect(
      toPublicWakaTimeStatus(
        { data: { last_heartbeat_at: "2026-08-09T11:58:00.000Z" } },
        {
          data: {
            grand_total: { text: "2 hrs", total_seconds: 7_200 },
          },
        },
        null,
        {
          end: "2026-08-08T23:59:59Z",
          data: [
            {
              range: { date: "2026-08-02" },
              grand_total: { total_seconds: 3_600 },
              languages: [
                { name: "TypeScript", total_seconds: 2_700 },
                { name: "CSS", total_seconds: 900 },
                { name: "Markdown", total_seconds: 10_000 },
              ],
              projects: [{ name: "private-project" }],
            },
            {
              range: { date: "2026-08-08" },
              grand_total: { total_seconds: 7_200 },
              languages: [{ name: "TypeScript", total_seconds: 7_200 }],
            },
          ],
        },
        now,
      ),
    ).toMatchObject({
      statsStale: false,
      todaySeconds: 7_200,
      weekSeconds: 10_800,
      dailyAverageSeconds: 5_400,
      topLanguage: { name: "TypeScript", percent: 100 },
      days: [
        { date: "2026-08-02", totalSeconds: 3_600 },
        { date: "2026-08-03", totalSeconds: 0 },
        { date: "2026-08-04", totalSeconds: 0 },
        { date: "2026-08-05", totalSeconds: 0 },
        { date: "2026-08-06", totalSeconds: 0 },
        { date: "2026-08-07", totalSeconds: 0 },
        { date: "2026-08-08", totalSeconds: 7_200 },
      ],
    });
  });

  it("retains last-known totals when a same-week refresh is partial", () => {
    const fallback = {
      isCoding: true,
      statsStale: false,
      todayDate: "2026-08-09",
      todayText: "2 hrs",
      todaySeconds: 7_200,
      weekSeconds: 18_000,
      dailyAverageSeconds: 9_000,
      topLanguage: { name: "TypeScript", percent: 80 },
      days: [{ date: "2026-08-09", totalSeconds: 18_000 }],
      lastActiveAt: "2026-08-09T11:59:00.000Z",
      checkedAt: "2026-08-09T12:00:00.000Z",
    };
    const partial = {
      ...fallback,
      statsStale: true,
      todayText: null,
      todaySeconds: null,
      weekSeconds: null,
      dailyAverageSeconds: null,
      topLanguage: null,
      days: [],
      checkedAt: "2026-08-09T12:01:00.000Z",
    };

    expect(retainLastKnownWakaTimeStats(partial, fallback)).toMatchObject({
      statsStale: true,
      todaySeconds: 7_200,
      weekSeconds: 18_000,
      dailyAverageSeconds: 9_000,
      topLanguage: { name: "TypeScript", percent: 80 },
      days: [{ date: "2026-08-09", totalSeconds: 18_000 }],
      checkedAt: "2026-08-09T12:01:00.000Z",
    });
  });
});
