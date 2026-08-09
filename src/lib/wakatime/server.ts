import "server-only";

import { getServerEnv } from "@/lib/env";
import { logServer } from "@/lib/logger";
import {
  inactiveWakaTimeStatus,
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

  const [userResponse, todayResult] = await Promise.all([
    request(WAKATIME_API_URL),
    request(WAKATIME_TODAY_URL).catch(() => null),
  ]);
  const userPayload = await getJson(userResponse, "user endpoint");
  const todayPayload = todayResult?.ok ? await todayResult.json() : null;

  return toPublicWakaTimeStatus(userPayload, todayPayload, now);
}

async function refreshWakaTimeStatus() {
  const env = getServerEnv();
  const now = new Date();
  if (!env.WAKATIME_API_KEY) return inactiveWakaTimeStatus(now);

  try {
    return await fetchWakaTimeStatus(env.WAKATIME_API_KEY, now);
  } catch (error) {
    logServer("warn", "wakatime.status_fetch_failed", {
      error: String(error),
    });
    return inactiveWakaTimeStatus(now);
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
