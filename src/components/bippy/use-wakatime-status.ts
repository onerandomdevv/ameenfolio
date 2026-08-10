"use client";

import { useEffect, useState } from "react";
import {
  isPublicWakaTimeStatus,
  type PublicWakaTimeStatus,
} from "@/lib/wakatime/status";

const REFRESH_INTERVAL_MS = 60_000;

export function useWakaTimeStatus() {
  const [status, setStatus] = useState<PublicWakaTimeStatus | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let requestInFlight = false;

    const refresh = async () => {
      if (requestInFlight || document.visibilityState === "hidden") return;
      requestInFlight = true;
      try {
        const response = await fetch("/api/wakatime/status", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) return;
        const payload: unknown = await response.json();
        if (isPublicWakaTimeStatus(payload)) setStatus(payload);
      } catch {
        // Live presence is an enhancement. Network failures retain the last
        // known status and must never disrupt the portfolio.
      } finally {
        requestInFlight = false;
      }
    };

    void refresh();
    const interval = window.setInterval(refresh, REFRESH_INTERVAL_MS);
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      controller.abort();
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return status;
}
