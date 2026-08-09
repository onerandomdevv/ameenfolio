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

const DAY_MS = 24 * 60 * 60 * 1000;

// contributionsCollection accepts at most one year between `from` and `to`, so
// an all-time total has to be assembled from consecutive year-long windows.
export function contributionWindows(createdAt: Date, now: Date) {
  const windows: { from: Date; to: Date }[] = [];
  let cursor = createdAt;

  while (cursor < now) {
    const next = new Date(cursor);
    next.setUTCFullYear(next.getUTCFullYear() + 1);

    // A calendar year is 366 days when it contains a leap day, so a day count
    // cannot tell a legal window from an illegal one. The tell is the day of
    // the month changing: 29 February has no counterpart in a common year and
    // rolls forward to 1 March, putting the window a day over the limit.
    if (next.getUTCDate() !== cursor.getUTCDate()) {
      next.setTime(next.getTime() - DAY_MS);
    }

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

const asDate = (day: string | null) =>
  day ? new Date(`${day}T00:00:00.000Z`) : null;

export function computeStreaks(days: ContributionDay[]) {
  let longestStreak = 0;
  let longestStart: string | null = null;
  let longestEnd: string | null = null;
  let run = 0;
  let runStart: string | null = null;

  for (const day of days) {
    if (day.count === 0) {
      run = 0;
      runStart = null;
      continue;
    }

    if (run === 0) runStart = day.date;
    run += 1;

    // Strictly greater, so a tie keeps the earlier run. Re-dating the record
    // every time it is merely equalled would make the "best" range jump around
    // for no reason a reader could see.
    if (run > longestStreak) {
      longestStreak = run;
      longestStart = runStart;
      longestEnd = day.date;
    }
  }

  // A quiet today does not end the streak — the day is not over yet. Any
  // earlier gap does, so only the final entry is allowed to be a zero.
  let index = days.length - 1;
  if (index >= 0 && days[index].count === 0) index -= 1;

  const currentEnd =
    index >= 0 && days[index].count > 0 ? days[index].date : null;
  let currentStreak = 0;
  let currentStart: string | null = null;

  for (; index >= 0 && days[index].count > 0; index -= 1) {
    currentStreak += 1;
    currentStart = days[index].date;
  }

  return {
    currentStreak,
    currentStreakStart: asDate(currentStart),
    currentStreakEnd: asDate(currentEnd),
    longestStreak,
    longestStreakStart: asDate(longestStart),
    longestStreakEnd: asDate(longestEnd),
  };
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
