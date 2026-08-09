export type ContributionDay = {
  date: string;
  count: number;
};

export type ContributionCalendar = {
  contributionCalendar: {
    weeks: {
      contributionDays: { date: string; contributionCount: number }[];
    }[];
  };
};

// contributionsCollection accepts at most one year between `from` and `to`, so
// an all-time total has to be assembled from consecutive year-long windows.
export function contributionWindows(createdAt: Date, now: Date) {
  const windows: { from: Date; to: Date }[] = [];
  let cursor = createdAt;

  while (cursor < now) {
    const next = new Date(cursor);
    next.setUTCFullYear(next.getUTCFullYear() + 1);
    windows.push({ from: cursor, to: next > now ? now : next });
    cursor = next;
  }

  // An account created moments ago — or a clock skew — leaves no window at all.
  // Ask for one anyway so the caller gets a real calendar rather than nothing.
  if (!windows.length) windows.push({ from: createdAt, to: now });
  return windows;
}

// Adjacent windows share a boundary day, so days are merged by date and totals
// summed from the merged calendar. Summing each window's own total instead
// would count every boundary day twice.
export function mergeContributionDays(
  calendars: ContributionCalendar[],
): ContributionDay[] {
  const byDate = new Map<string, number>();

  for (const calendar of calendars) {
    for (const week of calendar.contributionCalendar.weeks) {
      for (const day of week.contributionDays) {
        byDate.set(
          day.date,
          Math.max(byDate.get(day.date) ?? 0, day.contributionCount),
        );
      }
    }
  }

  return [...byDate.entries()]
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function computeStreaks(days: ContributionDay[]) {
  let longestStreak = 0;
  let run = 0;

  for (const day of days) {
    run = day.count > 0 ? run + 1 : 0;
    if (run > longestStreak) longestStreak = run;
  }

  // A quiet today does not end the streak — the day is not over yet. Any
  // earlier gap does, so only the final entry is allowed to be a zero.
  let index = days.length - 1;
  if (index >= 0 && days[index].count === 0) index -= 1;

  let currentStreak = 0;
  for (; index >= 0 && days[index].count > 0; index -= 1) currentStreak += 1;

  return { currentStreak, longestStreak };
}

export function summarizeContributions(days: ContributionDay[]) {
  const firstContribution = days.find((day) => day.count > 0);

  return {
    contributions: days.reduce((total, day) => total + day.count, 0),
    ...computeStreaks(days),
    firstContributionAt: firstContribution
      ? new Date(`${firstContribution.date}T00:00:00.000Z`)
      : null,
  };
}
