import { z } from "zod";

export const WAKATIME_ACTIVE_WINDOW_MS = 5 * 60 * 1000;

export type PublicWakaTimeStatus = {
  isCoding: boolean;
  todayText: string | null;
  checkedAt: string;
};

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
    }),
  }),
});

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

  return {
    isCoding: isRecentWakaTimeHeartbeat(heartbeatAt, now.getTime()),
    todayText,
    checkedAt: now.toISOString(),
  };
}

export function getWakaTimeHeartbeatDate(
  userPayload: unknown,
  now = new Date(),
) {
  const user = userResponseSchema.parse(userPayload);
  const timeZone = user.data.timezone || "UTC";

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
  return { isCoding: false, todayText: null, checkedAt: now.toISOString() };
}

export function isPublicWakaTimeStatus(
  value: unknown,
): value is PublicWakaTimeStatus {
  if (!value || typeof value !== "object") return false;
  const status = value as Partial<PublicWakaTimeStatus>;
  return (
    typeof status.isCoding === "boolean" &&
    (status.todayText === null ||
      (typeof status.todayText === "string" &&
        status.todayText.length <= 48)) &&
    typeof status.checkedAt === "string" &&
    Number.isFinite(Date.parse(status.checkedAt))
  );
}
