import "server-only";

import { getServerEnv } from "@/lib/env";
import { logServer } from "@/lib/logger";
import {
  getSundayWeekDates,
  getWakaTimeHeartbeatDate,
  getWakaTimeTimeZone,
  inactiveWakaTimeStatus,
  isRecentWakaTimeHeartbeat,
  retainLastKnownWakaTimeStats,
  toPublicWakaTimeStatus,
  type PublicWakaTimeStatus,
} from "@/lib/wakatime/status";

const WAKATIME_API_URL = "https://wakatime.com/api/v1/users/current";
const WAKATIME_TODAY_URL = `${WAKATIME_API_URL}/status_bar/today`;
const REQUEST_TIMEOUT_MS = 8_000;
const STATUS_CACHE_MS = 60_000;

type CachedStatus = { value: PublicWakaTimeStatus; expiresAt: number };

let cachedStatus: CachedStatus | null = null;
let inFlight: Promise<PublicWakaTimeStatus> | null = null;
let lastCompleteStatus: PublicWakaTimeStatus | null = null;
let lastKnownTimeZone = "UTC";

async function getJson(response: Response, endpoint: string) {
  if (!response.ok) {
    throw new Error(`WakaTime ${endpoint} responded ${response.status}`);
  }
  return response.json() as Promise<unknown>;
}

export async function fetchWakaTimeStatus(
  apiKey: string,
  now = new Date(),
): Promise<PublicWakaTimeStatus> {
  const authorization = `Basic ${Buffer.from(apiKey).toString("base64")}`;
  const request = (url: string) =>
    fetch(url, {
      headers: { authorization, accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

  const userResponse = await request(WAKATIME_API_URL);
  const userPayload = await getJson(userResponse, "user endpoint");
  lastKnownTimeZone = getWakaTimeTimeZone(userPayload);
  const heartbeatDate = getWakaTimeHeartbeatDate(userPayload, now);
  const weekStartDate = getSundayWeekDates(heartbeatDate)[0] ?? heartbeatDate;
  const heartbeatsUrl = `${WAKATIME_API_URL}/heartbeats?date=${heartbeatDate}`;
  const summariesUrl = `${WAKATIME_API_URL}/summaries?start=${weekStartDate}&end=${heartbeatDate}`;
  const [todayResult, heartbeatsResult, summariesResult] = await Promise.all([
    request(WAKATIME_TODAY_URL).catch(() => null),
    request(heartbeatsUrl).catch(() => null),
    request(summariesUrl).catch(() => null),
  ]);
  const readJson = async (result: Response | null) => {
    if (!result?.ok) return null;
    return result.json().catch(() => null) as Promise<unknown>;
  };
  const [todayPayload, heartbeatsPayload, summariesPayload] = await Promise.all(
    [
      readJson(todayResult),
      readJson(heartbeatsResult),
      readJson(summariesResult),
    ],
  );

  return toPublicWakaTimeStatus(
    userPayload,
    todayPayload,
    heartbeatsPayload,
    summariesPayload,
    now,
  );
}

async function refreshWakaTimeStatus() {
  const env = getServerEnv();
  const now = new Date();
  if (!env.WAKATIME_API_KEY) return inactiveWakaTimeStatus(now);

  try {
    const fresh = await fetchWakaTimeStatus(env.WAKATIME_API_KEY, now);
    if (!fresh.statsStale) {
      lastCompleteStatus = fresh;
      return fresh;
    }
    return lastCompleteStatus
      ? retainLastKnownWakaTimeStats(fresh, lastCompleteStatus)
      : fresh;
  } catch (error) {
    logServer("warn", "wakatime.status_fetch_failed", {
      error: String(error),
    });
    if (!lastCompleteStatus) return inactiveWakaTimeStatus(now);

    const emptyCurrentStatus: PublicWakaTimeStatus = {
      ...inactiveWakaTimeStatus(now),
      isCoding: isRecentWakaTimeHeartbeat(
        lastCompleteStatus.lastActiveAt,
        now.getTime(),
      ),
      todayDate: getWakaTimeHeartbeatDate(
        { data: { timezone: lastKnownTimeZone } },
        now,
      ),
      lastActiveAt: lastCompleteStatus.lastActiveAt,
    };

    return retainLastKnownWakaTimeStats(emptyCurrentStatus, lastCompleteStatus);
  }
}

export async function getPublicWakaTimeStatus() {
  const now = Date.now();
  if (cachedStatus && cachedStatus.expiresAt > now) return cachedStatus.value;

  inFlight ??= refreshWakaTimeStatus()
    .then((value) => {
      cachedStatus = { value, expiresAt: Date.now() + STATUS_CACHE_MS };
      return value;
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}
