"use client";

import { useEffect, useState } from "react";
import {
  isPublicWakaTimeHistory,
  type PublicWakaTimeHistory,
  type WakaTimeHistoryMode,
} from "@/lib/wakatime/status";

export function useWakaTimeHistory(
  selection: { mode: WakaTimeHistoryMode; anchor: string } | null,
) {
  const requestKey = selection ? `${selection.mode}:${selection.anchor}` : null;
  const [result, setResult] = useState<{
    key: string;
    history: PublicWakaTimeHistory | null;
    error: boolean;
  } | null>(null);

  useEffect(() => {
    if (!selection || !requestKey) return;

    const controller = new AbortController();
    void fetch(
      `/api/wakatime/history?mode=${selection.mode}&anchor=${selection.anchor}`,
      { signal: controller.signal },
    )
      .then(async (response) => {
        if (!response.ok) throw new Error("History request failed");
        const payload: unknown = await response.json();
        if (!isPublicWakaTimeHistory(payload)) {
          throw new Error("History response was invalid");
        }
        setResult({ key: requestKey, history: payload, error: false });
      })
      .catch((requestError: unknown) => {
        if (
          requestError instanceof DOMException &&
          requestError.name === "AbortError"
        ) {
          return;
        }
        setResult({ key: requestKey, history: null, error: true });
      });

    return () => controller.abort();
  }, [requestKey, selection]);

  const currentResult = result?.key === requestKey ? result : null;
  return {
    history: currentResult?.history ?? null,
    loading: requestKey !== null && currentResult === null,
    error: currentResult?.error ?? false,
  };
}
