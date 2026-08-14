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
  toPublicWakaTimeHistory,
  toPublicWakaTimeStatus,
  type PublicWakaTimeHistory,
  type PublicWakaTimeStatus,
  type WakaTimeHistoryMode,
} from "@/lib/wakatime/status";

const WAKATIME_API_URL = "https://wakatime.com/api/v1/users/current";
const WAKATIME_TODAY_URL = `${WAKATIME_API_URL}/status_bar/today`;
const REQUEST_TIMEOUT_MS = 8_000;
const STATUS_CACHE_MS = 60_000;
const HISTORY_CACHE_MAX_ENTRIES = 64;

type CachedStatus = { value: PublicWakaTimeStatus; expiresAt: number };
type CachedHistory = { value: PublicWakaTimeHistory; expiresAt: number };

let cachedStatus: CachedStatus | null = null;
let inFlight: Promise<PublicWakaTimeStatus> | null = null;
let lastCompleteStatus: PublicWakaTimeStatus | null = null;
let lastKnownTimeZone = "UTC";
const historyCache = new Map<string, CachedHistory>();

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

export async function fetchWakaTimeHistory(
  apiKey: string,
  mode: WakaTimeHistoryMode,
  startDate: string,
  endDate: string,
) {
  const authorization = `Basic ${Buffer.from(apiKey).toString("base64")}`;
  const response = await fetch(
    `${WAKATIME_API_URL}/summaries?start=${startDate}&end=${endDate}`,
    {
      headers: { authorization, accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    },
  );
  const payload = await getJson(response, "history summaries endpoint");
  return toPublicWakaTimeHistory(payload, mode, startDate, endDate);
}

export async function getPublicWakaTimeHistory(
  mode: WakaTimeHistoryMode,
  startDate: string,
  endDate: string,
) {
  const env = getServerEnv();
  if (!env.WAKATIME_API_KEY) throw new Error("WakaTime is not configured");

  const cacheKey = `${mode}:${startDate}:${endDate}`;
  const cached = historyCache.get(cacheKey);
  if (cached) {
    if (cached.expiresAt > Date.now()) return cached.value;
    historyCache.delete(cacheKey);
  }

  try {
    const value = await fetchWakaTimeHistory(
      env.WAKATIME_API_KEY,
      mode,
      startDate,
      endDate,
    );
    // The route is public and takes any anchor back to 2015, so one entry per
    // distinct range would grow for the life of the process. Map iterates in
    // insertion order, making the first key the oldest write.
    if (historyCache.size >= HISTORY_CACHE_MAX_ENTRIES) {
      const oldestKey = historyCache.keys().next().value;
      if (oldestKey !== undefined) historyCache.delete(oldestKey);
    }
    historyCache.set(cacheKey, {
      value,
      expiresAt: Date.now() + 60 * 60 * 1_000,
    });
    return value;
  } catch (error) {
    logServer("warn", "wakatime.history_fetch_failed", {
      mode,
      startDate,
      endDate,
      error: String(error),
    });
    throw error;
  }
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
