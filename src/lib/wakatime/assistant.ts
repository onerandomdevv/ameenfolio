import "server-only";

import { getServerEnv } from "@/lib/env";
import { getPublicWakaTimeStatus } from "@/lib/wakatime/server";
import {
  currentCodingActivityView,
  weeklyCodingActivityView,
} from "@/lib/wakatime/assistant-view";

export async function getCurrentCodingActivityForBippy() {
  const configured = Boolean(getServerEnv().WAKATIME_API_KEY);
  return currentCodingActivityView(await getPublicWakaTimeStatus(), configured);
}

export async function getWeeklyCodingActivityForBippy() {
  const configured = Boolean(getServerEnv().WAKATIME_API_KEY);
  return weeklyCodingActivityView(await getPublicWakaTimeStatus(), configured);
}
