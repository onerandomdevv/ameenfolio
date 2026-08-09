import { describe, expect, it } from "vitest";
import {
  computeStreaks,
  contributionWindows,
  mergeContributionDays,
  summarizeContributions,
  type ContributionCalendar,
} from "@/lib/stats/contributions";

function days(counts: number[], start = "2026-08-01") {
  const from = new Date(`${start}T00:00:00.000Z`);
  return counts.map((count, index) => {
    const date = new Date(from);
    date.setUTCDate(date.getUTCDate() + index);
    return { date: date.toISOString().slice(0, 10), count };
  });
}

function calendar(entries: { date: string; count: number }[]) {
  return {
    contributionCalendar: {
      weeks: [
        {
          contributionDays: entries.map((entry) => ({
            date: entry.date,
            contributionCount: entry.count,
          })),
        },
      ],
    },
  } satisfies ContributionCalendar;
}

describe("contributionWindows", () => {
  it("splits a multi-year span into year-long windows", () => {
    const windows = contributionWindows(
      new Date("2023-03-01T00:00:00.000Z"),
      new Date("2026-08-09T00:00:00.000Z"),
    );

    expect(windows).toHaveLength(4);
    expect(windows[0].from.toISOString()).toBe("2023-03-01T00:00:00.000Z");
    expect(windows[0].to.toISOString()).toBe("2024-03-01T00:00:00.000Z");
    expect(windows.at(-1)!.to.toISOString()).toBe("2026-08-09T00:00:00.000Z");
  });

  it("never exceeds one year per window", () => {
    const oneYearMs = 366 * 24 * 60 * 60 * 1000;
    const windows = contributionWindows(
      new Date("2019-01-01T00:00:00.000Z"),
      new Date("2026-08-09T00:00:00.000Z"),
    );

    for (const window of windows) {
      expect(window.to.getTime() - window.from.getTime()).toBeLessThanOrEqual(
        oneYearMs,
      );
    }
  });

  it("still returns a window when the account is younger than the clock", () => {
    const now = new Date("2026-08-09T00:00:00.000Z");
    expect(contributionWindows(now, now)).toHaveLength(1);
  });
});

describe("mergeContributionDays", () => {
  it("counts a day shared by two windows only once", () => {
    const merged = mergeContributionDays([
      calendar([{ date: "2026-03-01", count: 4 }]),
      calendar([{ date: "2026-03-01", count: 4 }]),
    ]);

    expect(merged).toEqual([{ date: "2026-03-01", count: 4 }]);
  });

  it("returns days in ascending date order", () => {
    const merged = mergeContributionDays([
      calendar([{ date: "2026-03-02", count: 1 }]),
      calendar([{ date: "2026-03-01", count: 2 }]),
    ]);

    expect(merged.map((day) => day.date)).toEqual(["2026-03-01", "2026-03-02"]);
  });
});

describe("computeStreaks", () => {
  it("finds the longest run of contributing days", () => {
    expect(computeStreaks(days([1, 1, 0, 1, 1, 1, 0, 2])).longestStreak).toBe(
      3,
    );
  });

  it("counts the current streak back from the last day", () => {
    expect(computeStreaks(days([1, 0, 3, 4, 5])).currentStreak).toBe(3);
  });

  it("keeps the streak alive when today has no contributions yet", () => {
    expect(computeStreaks(days([1, 1, 1, 0])).currentStreak).toBe(3);
  });

  it("breaks the streak on a gap before today", () => {
    expect(computeStreaks(days([1, 1, 0, 0])).currentStreak).toBe(0);
  });

  it("handles an empty calendar", () => {
    expect(computeStreaks([])).toEqual({
      currentStreak: 0,
      currentStreakStart: null,
      currentStreakEnd: null,
      longestStreak: 0,
      longestStreakStart: null,
      longestStreakEnd: null,
    });
  });

  it("dates the current streak from its first to its last day", () => {
    const streaks = computeStreaks(days([0, 1, 1, 1], "2026-08-06"));

    expect(streaks.currentStreak).toBe(3);
    expect(streaks.currentStreakStart?.toISOString().slice(0, 10)).toBe(
      "2026-08-07",
    );
    expect(streaks.currentStreakEnd?.toISOString().slice(0, 10)).toBe(
      "2026-08-09",
    );
  });

  it("dates the longest streak even when it is not the current one", () => {
    // Four-day run in May, then a shorter run at the end of the window.
    const streaks = computeStreaks(days([1, 1, 1, 1, 0, 1, 1], "2026-05-01"));

    expect(streaks.longestStreak).toBe(4);
    expect(streaks.longestStreakStart?.toISOString().slice(0, 10)).toBe(
      "2026-05-01",
    );
    expect(streaks.longestStreakEnd?.toISOString().slice(0, 10)).toBe(
      "2026-05-04",
    );
  });

  it("keeps the earlier range when a later run ties the record", () => {
    const streaks = computeStreaks(days([1, 1, 0, 1, 1], "2026-05-01"));

    expect(streaks.longestStreak).toBe(2);
    expect(streaks.longestStreakStart?.toISOString().slice(0, 10)).toBe(
      "2026-05-01",
    );
  });

  it("leaves the current range empty when the streak is broken", () => {
    const streaks = computeStreaks(days([1, 1, 0, 0]));

    expect(streaks.currentStreak).toBe(0);
    expect(streaks.currentStreakStart).toBeNull();
    expect(streaks.currentStreakEnd).toBeNull();
  });
});

describe("summarizeContributions", () => {
  it("totals every day and dates the first contribution", () => {
    const summary = summarizeContributions(days([0, 0, 5, 3, 1]));

    expect(summary.contributions).toBe(9);
    expect(summary.currentStreak).toBe(3);
    expect(summary.longestStreak).toBe(3);
    expect(summary.firstContributionAt?.toISOString()).toBe(
      "2026-08-03T00:00:00.000Z",
    );
  });

  it("reports no first contribution for an empty history", () => {
    expect(summarizeContributions(days([0, 0])).firstContributionAt).toBeNull();
  });
});
