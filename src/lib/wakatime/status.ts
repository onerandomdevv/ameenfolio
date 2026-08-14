import { z } from "zod";

export const WAKATIME_ACTIVE_WINDOW_MS = 5 * 60 * 1000;

const publicWakaTimeDaySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  totalSeconds: z.number().finite().nonnegative().max(86_400),
});

export const wakaTimeHistoryModeSchema = z.enum(["week", "month"]);

const publicWakaTimeHistorySchema = z.object({
  mode: wakaTimeHistoryModeSchema,
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  totalSeconds: z.number().finite().nonnegative().max(2_678_400),
  dailyAverageSeconds: z.number().finite().nonnegative().max(86_400),
  topLanguage: z
    .object({
      name: z.string().min(1).max(48),
      percent: z.number().finite().min(0).max(100),
    })
    .nullable(),
  days: z.array(publicWakaTimeDaySchema).max(31),
});

const publicWakaTimeStatusSchema = z.object({
  isCoding: z.boolean(),
  statsStale: z.boolean(),
  todayDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable(),
  todayText: z.string().max(48).nullable(),
  todaySeconds: z.number().finite().nonnegative().max(86_400).nullable(),
  weekSeconds: z.number().finite().nonnegative().max(604_800).nullable(),
  dailyAverageSeconds: z.number().finite().nonnegative().max(86_400).nullable(),
  topLanguage: z
    .object({
      name: z.string().min(1).max(48),
      percent: z.number().finite().min(0).max(100),
    })
    .nullable(),
  days: z.array(publicWakaTimeDaySchema).max(7),
  lastActiveAt: z.iso.datetime().nullable(),
  checkedAt: z.iso.datetime(),
});

export type PublicWakaTimeStatus = z.infer<typeof publicWakaTimeStatusSchema>;
export type PublicWakaTimeHistory = z.infer<typeof publicWakaTimeHistorySchema>;
export type WakaTimeHistoryMode = z.infer<typeof wakaTimeHistoryModeSchema>;

type WeekSummary = Pick<
  PublicWakaTimeStatus,
  "days" | "weekSeconds" | "dailyAverageSeconds" | "topLanguage"
> & { available: boolean };

const userResponseSchema = z.object({
  data: z.object({
    last_heartbeat_at: z.string().nullable().optional(),
    timezone: z.string().optional(),
  }),
});

const heartbeatsResponseSchema = z.object({
  data: z.array(z.object({ time: z.number() })),
});

const todayResponseSchema = z.object({
  data: z.object({
    grand_total: z.object({
      text: z.string().optional(),
      total_seconds: z.number().nonnegative().optional(),
    }),
  }),
});

const summariesResponseSchema = z.object({
  end: z.string().optional(),
  data: z.array(
    z.object({
      grand_total: z.object({
        total_seconds: z.number().nonnegative().optional(),
      }),
      languages: z
        .array(
          z.object({
            name: z.string(),
            total_seconds: z.number().nonnegative().optional(),
          }),
        )
        .optional(),
      range: z.object({ date: z.string() }),
    }),
  ),
});

const excludedTopLanguageNames = new Set([
  "css",
  "csv",
  "git config",
  "html",
  "ini",
  "json",
  "less",
  "markdown",
  "mdx",
  "sass",
  "scss",
  "text",
  "toml",
  "xml",
  "yaml",
]);

function normalizeHeartbeatAt(value: string | null | undefined) {
  if (!value || !Number.isFinite(Date.parse(value))) return null;
  return new Date(value).toISOString();
}

export function getSundayWeekDates(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return [];
  const anchor = new Date(`${value}T12:00:00.000Z`);
  if (!Number.isFinite(anchor.getTime())) return [];
  anchor.setUTCDate(anchor.getUTCDate() - anchor.getUTCDay());

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(anchor);
    date.setUTCDate(anchor.getUTCDate() + index);
    return date.toISOString().slice(0, 10);
  });
}

export function getWakaTimeHistoryRange(
  mode: WakaTimeHistoryMode,
  anchorDate: string,
  todayDate: string,
) {
  const anchor = new Date(`${anchorDate}T12:00:00.000Z`);
  const today = new Date(`${todayDate}T12:00:00.000Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(anchorDate) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(todayDate) ||
    !Number.isFinite(anchor.getTime()) ||
    !Number.isFinite(today.getTime()) ||
    anchor.toISOString().slice(0, 10) !== anchorDate ||
    today.toISOString().slice(0, 10) !== todayDate ||
    anchor > today
  ) {
    return null;
  }

  let start: Date;
  let end: Date;
  if (mode === "week") {
    start = new Date(anchor);
    start.setUTCDate(start.getUTCDate() - start.getUTCDay());
    end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 6);
  } else {
    start = new Date(
      Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), 1),
    );
    end = new Date(
      Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() + 1, 0),
    );
  }

  if (end > today) end = today;
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

export function retainLastKnownWakaTimeStats(
  fresh: PublicWakaTimeStatus,
  fallback: PublicWakaTimeStatus,
): PublicWakaTimeStatus {
  const sameDay = fresh.todayDate === fallback.todayDate;
  const freshWeekStart = fresh.todayDate
    ? getSundayWeekDates(fresh.todayDate)[0]
    : null;
  const fallbackWeekStart = fallback.todayDate
    ? getSundayWeekDates(fallback.todayDate)[0]
    : null;
  const sameWeek =
    freshWeekStart !== null && freshWeekStart === fallbackWeekStart;

  return {
    ...fresh,
    todayText: fresh.todayText ?? (sameDay ? fallback.todayText : null),
    todaySeconds:
      fresh.todaySeconds ?? (sameDay ? fallback.todaySeconds : null),
    weekSeconds: fresh.weekSeconds ?? (sameWeek ? fallback.weekSeconds : null),
    dailyAverageSeconds:
      fresh.dailyAverageSeconds ??
      (sameWeek ? fallback.dailyAverageSeconds : null),
    topLanguage: fresh.topLanguage ?? (sameWeek ? fallback.topLanguage : null),
    days: fresh.days.length ? fresh.days : sameWeek ? fallback.days : [],
    statsStale: true,
  };
}

function summarizeWeek(payload: unknown) {
  const summaries = summariesResponseSchema.safeParse(payload);
  if (!summaries.success) {
    return {
      days: [],
      weekSeconds: null,
      dailyAverageSeconds: null,
      topLanguage: null,
      available: false,
    } satisfies WeekSummary;
  }

  const reportedDays = summaries.data.data
    .filter((summary) => /^\d{4}-\d{2}-\d{2}$/.test(summary.range.date))
    .map((summary) => ({
      date: summary.range.date,
      totalSeconds: Math.min(
        Math.max(summary.grand_total.total_seconds ?? 0, 0),
        86_400,
      ),
    }))
    .sort((left, right) => left.date.localeCompare(right.date));
  const anchorDate =
    summaries.data.end?.slice(0, 10) ?? reportedDays.at(-1)?.date ?? "";
  const weekDates = getSundayWeekDates(anchorDate);
  const reportedTotals = new Map(
    reportedDays.map((day) => [day.date, day.totalSeconds]),
  );
  const days = weekDates.map((date) => ({
    date,
    totalSeconds: reportedTotals.get(date) ?? 0,
  }));
  const weekSeconds = Math.min(
    days.reduce((total, day) => total + day.totalSeconds, 0),
    604_800,
  );
  const activeDays = days.filter((day) => day.totalSeconds > 0);
  const languages = new Map<string, number>();

  for (const summary of summaries.data.data) {
    if (!weekDates.includes(summary.range.date)) continue;
    for (const language of summary.languages ?? []) {
      const name = language.name.trim().slice(0, 48);
      if (!name || excludedTopLanguageNames.has(name.toLowerCase())) continue;
      languages.set(
        name,
        (languages.get(name) ?? 0) + (language.total_seconds ?? 0),
      );
    }
  }

  const [topLanguageName, topLanguageSeconds] = [...languages.entries()].sort(
    ([, left], [, right]) => right - left,
  )[0] ?? [null, 0];
  const languageSeconds = [...languages.values()].reduce(
    (total, seconds) => total + seconds,
    0,
  );

  return {
    days,
    weekSeconds,
    dailyAverageSeconds: activeDays.length
      ? weekSeconds / activeDays.length
      : 0,
    topLanguage:
      topLanguageName && languageSeconds > 0
        ? {
            name: topLanguageName,
            percent: Math.round((topLanguageSeconds / languageSeconds) * 100),
          }
        : null,
    available: true,
  } satisfies WeekSummary;
}

function enumerateDates(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T12:00:00.000Z`);
  const end = new Date(`${endDate}T12:00:00.000Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(startDate) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(endDate) ||
    !Number.isFinite(start.getTime()) ||
    !Number.isFinite(end.getTime()) ||
    start > end
  ) {
    return [];
  }

  // Ascending, which callers rely on: groupDaysByWeek in the strip takes the
  // last day it sees for a week as that week's end date.
  const dates: string[] = [];
  const cursor = start;
  while (cursor <= end && dates.length < 31) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

export function toPublicWakaTimeHistory(
  payload: unknown,
  mode: WakaTimeHistoryMode,
  startDate: string,
  endDate: string,
): PublicWakaTimeHistory {
  const summaries = summariesResponseSchema.parse(payload);
  const dates = enumerateDates(startDate, endDate);
  if (!dates.length) throw new Error("Invalid WakaTime history range");

  const requestedDates = new Set(dates);
  const totals = new Map<string, number>();
  const languages = new Map<string, number>();

  for (const summary of summaries.data) {
    if (!requestedDates.has(summary.range.date)) continue;
    totals.set(
      summary.range.date,
      Math.min(Math.max(summary.grand_total.total_seconds ?? 0, 0), 86_400),
    );
    for (const language of summary.languages ?? []) {
      const name = language.name.trim().slice(0, 48);
      if (!name || excludedTopLanguageNames.has(name.toLowerCase())) continue;
      languages.set(
        name,
        (languages.get(name) ?? 0) + (language.total_seconds ?? 0),
      );
    }
  }

  const days = dates.map((date) => ({
    date,
    totalSeconds: totals.get(date) ?? 0,
  }));
  const totalSeconds = days.reduce((total, day) => total + day.totalSeconds, 0);
  const activeDays = days.filter((day) => day.totalSeconds > 0);
  const [topLanguageName, topLanguageSeconds] = [...languages.entries()].sort(
    ([, left], [, right]) => right - left,
  )[0] ?? [null, 0];
  const languageSeconds = [...languages.values()].reduce(
    (total, seconds) => total + seconds,
    0,
  );

  return publicWakaTimeHistorySchema.parse({
    mode,
    startDate,
    endDate,
    totalSeconds,
    dailyAverageSeconds: activeDays.length
      ? totalSeconds / activeDays.length
      : 0,
    topLanguage:
      topLanguageName && languageSeconds > 0
        ? {
            name: topLanguageName,
            percent: Math.round((topLanguageSeconds / languageSeconds) * 100),
          }
        : null,
    days,
  });
}

export function isRecentWakaTimeHeartbeat(
  value: string | null | undefined,
  now = Date.now(),
) {
  if (!value) return false;
  const heartbeatAt = Date.parse(value);
  if (!Number.isFinite(heartbeatAt)) return false;

  const age = now - heartbeatAt;
  return age >= -60_000 && age <= WAKATIME_ACTIVE_WINDOW_MS;
}

export function toPublicWakaTimeStatus(
  userPayload: unknown,
  todayPayload: unknown,
  heartbeatsPayload: unknown,
  summariesPayload: unknown,
  now = new Date(),
): PublicWakaTimeStatus {
  const user = userResponseSchema.parse(userPayload);
  const today = todayResponseSchema.safeParse(todayPayload);
  const heartbeats = heartbeatsResponseSchema.safeParse(heartbeatsPayload);
  const todayText = today.success
    ? today.data.data.grand_total.text?.trim().slice(0, 48) || null
    : null;
  const latestHeartbeat = heartbeats.success
    ? heartbeats.data.data.reduce<number | null>(
        (latest, heartbeat) =>
          latest === null || heartbeat.time > latest ? heartbeat.time : latest,
        null,
      )
    : null;
  const heartbeatAt =
    latestHeartbeat === null
      ? user.data.last_heartbeat_at
      : new Date(latestHeartbeat * 1_000).toISOString();
  const { available: weekAvailable, ...week } = summarizeWeek(summariesPayload);

  return publicWakaTimeStatusSchema.parse({
    isCoding: isRecentWakaTimeHeartbeat(heartbeatAt, now.getTime()),
    statsStale: !today.success || !weekAvailable,
    todayDate: getWakaTimeHeartbeatDate(userPayload, now),
    todayText,
    todaySeconds: today.success
      ? (today.data.data.grand_total.total_seconds ?? null)
      : null,
    ...week,
    lastActiveAt: normalizeHeartbeatAt(heartbeatAt),
    checkedAt: now.toISOString(),
  });
}

export function getWakaTimeTimeZone(userPayload: unknown) {
  const user = userResponseSchema.parse(userPayload);
  const timeZone = user.data.timezone || "UTC";

  try {
    new Intl.DateTimeFormat("en-US", { timeZone }).format();
    return timeZone;
  } catch {
    return "UTC";
  }
}

export function getWakaTimeHeartbeatDate(
  userPayload: unknown,
  now = new Date(),
) {
  const timeZone = getWakaTimeTimeZone(userPayload);

  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(now);
    const part = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((item) => item.type === type)?.value;
    return `${part("year")}-${part("month")}-${part("day")}`;
  } catch {
    return now.toISOString().slice(0, 10);
  }
}

export function inactiveWakaTimeStatus(now = new Date()): PublicWakaTimeStatus {
  return {
    isCoding: false,
    statsStale: true,
    todayDate: null,
    todayText: null,
    todaySeconds: null,
    weekSeconds: null,
    dailyAverageSeconds: null,
    topLanguage: null,
    days: [],
    lastActiveAt: null,
    checkedAt: now.toISOString(),
  };
}

export function isPublicWakaTimeStatus(
  value: unknown,
): value is PublicWakaTimeStatus {
  return publicWakaTimeStatusSchema.safeParse(value).success;
}

export function isPublicWakaTimeHistory(
  value: unknown,
): value is PublicWakaTimeHistory {
  return publicWakaTimeHistorySchema.safeParse(value).success;
}
