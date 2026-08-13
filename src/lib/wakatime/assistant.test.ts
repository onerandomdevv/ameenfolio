import { describe, expect, it } from "vitest";
import {
  currentCodingActivityView,
  formatWakaTimeDuration,
  weeklyCodingActivityView,
} from "@/lib/wakatime/assistant-view";

const status = {
  isCoding: true,
  statsStale: false,
  todayDate: "2026-08-16",
  todayText: "2 hrs 5 mins",
  todaySeconds: 7_500,
  weekSeconds: 18_000,
  dailyAverageSeconds: 6_000,
  topLanguage: { name: "TypeScript", percent: 72 },
  days: [
    { date: "2026-08-16", totalSeconds: 7_500 },
    { date: "2026-08-17", totalSeconds: 0 },
  ],
  lastActiveAt: "2026-08-16T12:00:00.000Z",
  checkedAt: "2026-08-16T12:01:00.000Z",
};

describe("Bippy WakaTime views", () => {
  it("formats durations for model-readable answers", () => {
    expect(formatWakaTimeDuration(null)).toBeNull();
    expect(formatWakaTimeDuration(2_700)).toBe("45 min");
    expect(formatWakaTimeDuration(7_500)).toBe("2 hr 5 min");
  });

  it("returns only current privacy-safe activity", () => {
    expect(currentCodingActivityView(status, true)).toEqual({
      configured: true,
      isCodingNow: true,
      today: {
        date: "2026-08-16",
        duration: "2 hr 5 min",
        seconds: 7_500,
      },
      lastActiveAt: "2026-08-16T12:00:00.000Z",
      checkedAt: "2026-08-16T12:01:00.000Z",
      statsMayBeDelayed: false,
    });
  });

  it("returns the weekly summary without projects or branches", () => {
    const view = weeklyCodingActivityView(status, true);
    expect(view).toMatchObject({
      configured: true,
      week: { duration: "5 hr", seconds: 18_000 },
      activeDayAverage: { duration: "1 hr 40 min", seconds: 6_000 },
      topProgrammingLanguage: { name: "TypeScript", percent: 72 },
      days: [
        { date: "2026-08-16", duration: "2 hr 5 min", seconds: 7_500 },
        { date: "2026-08-17", duration: "0 min", seconds: 0 },
      ],
    });
    expect(JSON.stringify(view)).not.toMatch(/project|branch|machine/i);
  });

  it("distinguishes an unconfigured integration from inactivity", () => {
    expect(currentCodingActivityView(status, false).isCodingNow).toBeNull();
  });
});
