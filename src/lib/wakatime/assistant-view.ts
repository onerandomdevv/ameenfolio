import type { PublicWakaTimeStatus } from "@/lib/wakatime/status";

export function formatWakaTimeDuration(seconds: number | null) {
  if (seconds === null) return null;
  const minutes = Math.round(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (!hours) return `${remainder} min`;
  return remainder ? `${hours} hr ${remainder} min` : `${hours} hr`;
}

export function currentCodingActivityView(
  status: PublicWakaTimeStatus,
  configured: boolean,
) {
  return {
    configured,
    isCodingNow: configured ? status.isCoding : null,
    today: {
      date: status.todayDate,
      duration: formatWakaTimeDuration(status.todaySeconds),
      seconds: status.todaySeconds,
    },
    lastActiveAt: status.lastActiveAt,
    checkedAt: status.checkedAt,
    statsMayBeDelayed: status.statsStale,
  };
}

export function weeklyCodingActivityView(
  status: PublicWakaTimeStatus,
  configured: boolean,
) {
  return {
    configured,
    week: {
      duration: formatWakaTimeDuration(status.weekSeconds),
      seconds: status.weekSeconds,
    },
    activeDayAverage: {
      duration: formatWakaTimeDuration(status.dailyAverageSeconds),
      seconds: status.dailyAverageSeconds,
    },
    topProgrammingLanguage: status.topLanguage,
    days: status.days.map((day) => ({
      date: day.date,
      duration: formatWakaTimeDuration(day.totalSeconds),
      seconds: day.totalSeconds,
    })),
    checkedAt: status.checkedAt,
    statsMayBeDelayed: status.statsStale,
  };
}
