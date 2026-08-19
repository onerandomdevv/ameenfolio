import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  fetchWakaTimeHistory,
  fetchWakaTimeStatus,
} from "@/lib/wakatime/server";

const now = new Date("2026-08-09T12:00:00.000Z");
const emptyWeek = { data: [] };

const emptyActivity = {
  todaySeconds: null,
  weekSeconds: 0,
  dailyAverageSeconds: 0,
  topLanguage: null,
  days: [],
};

function jsonResponse(value: unknown, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "content-type": "application/json" },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe("WakaTime server client", () => {
  it("fetches a bounded historical range without exposing private entities", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      jsonResponse({
        data: [
          {
            range: { date: "2026-08-02" },
            grand_total: { total_seconds: 3_600 },
            languages: [{ name: "TypeScript", total_seconds: 3_600 }],
            projects: [{ name: "private-project" }],
          },
        ],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const history = await fetchWakaTimeHistory(
      "waka_secret",
      "week",
      "2026-08-02",
      "2026-08-08",
    );

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("summaries?start=2026-08-02&end=2026-08-08"),
      expect.objectContaining({
        headers: expect.objectContaining({
          authorization: `Basic ${Buffer.from("waka_secret").toString("base64")}`,
        }),
      }),
    );
    expect(history.totalSeconds).toBe(3_600);
    expect(JSON.stringify(history)).not.toContain("private-project");
  });

  it("authenticates server-side and returns only sanitized data", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        jsonResponse({
          data: {
            last_heartbeat_at: "2026-08-09T10:00:00.000Z",
            last_project: "private-project",
            last_branch: "secret-branch",
            timezone: "Africa/Lagos",
          },
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({ data: { grand_total: { text: "2 hrs 8 mins" } } }),
      )
      .mockResolvedValueOnce(
        jsonResponse({ data: [{ time: now.getTime() / 1_000 - 30 }] }),
      )
      .mockResolvedValueOnce(jsonResponse(emptyWeek));
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchWakaTimeStatus("waka_secret", now)).resolves.toEqual({
      isCoding: true,
      statsStale: false,
      todayDate: "2026-08-09",
      todayText: "2 hrs 8 mins",
      ...emptyActivity,
      lastActiveAt: "2026-08-09T11:59:30.000Z",
      checkedAt: now.toISOString(),
    });

    expect(fetchMock).toHaveBeenCalledTimes(4);
    for (const [, init] of fetchMock.mock.calls) {
      expect(init?.headers).toEqual(
        expect.objectContaining({
          authorization: `Basic ${Buffer.from("waka_secret").toString("base64")}`,
        }),
      );
      expect(init?.cache).toBe("no-store");
    }
  });

  it("keeps live presence when only today's summary is unavailable", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        jsonResponse({
          data: {
            last_heartbeat_at: "2026-08-09T10:00:00.000Z",
            timezone: "Africa/Lagos",
          },
        }),
      )
      .mockResolvedValueOnce(jsonResponse({ error: "busy" }, 503))
      .mockResolvedValueOnce(
        jsonResponse({ data: [{ time: now.getTime() / 1_000 - 30 }] }),
      )
      .mockResolvedValueOnce(jsonResponse(emptyWeek));
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchWakaTimeStatus("waka_secret", now)).resolves.toEqual({
      isCoding: true,
      statsStale: true,
      todayDate: "2026-08-09",
      todayText: null,
      ...emptyActivity,
      lastActiveAt: "2026-08-09T11:59:30.000Z",
      checkedAt: now.toISOString(),
    });
  });

  it("keeps live presence when today's summary request rejects", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        jsonResponse({
          data: {
            last_heartbeat_at: "2026-08-09T10:00:00.000Z",
            timezone: "Africa/Lagos",
          },
        }),
      )
      .mockRejectedValueOnce(new Error("summary unavailable"))
      .mockResolvedValueOnce(
        jsonResponse({ data: [{ time: now.getTime() / 1_000 - 30 }] }),
      )
      .mockResolvedValueOnce(jsonResponse(emptyWeek));
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchWakaTimeStatus("waka_secret", now)).resolves.toEqual({
      isCoding: true,
      statsStale: true,
      todayDate: "2026-08-09",
      todayText: null,
      ...emptyActivity,
      lastActiveAt: "2026-08-09T11:59:30.000Z",
      checkedAt: now.toISOString(),
    });
  });

  it("keeps live presence when a secondary endpoint returns malformed JSON", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        jsonResponse({
          data: {
            last_heartbeat_at: "2026-08-09T11:59:00.000Z",
            timezone: "Africa/Lagos",
          },
        }),
      )
      .mockResolvedValueOnce(new Response("<html>Service unavailable</html>"))
      .mockResolvedValueOnce(
        jsonResponse({ data: [{ time: now.getTime() / 1_000 - 30 }] }),
      )
      .mockResolvedValueOnce(jsonResponse(emptyWeek));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      fetchWakaTimeStatus("waka_secret", now),
    ).resolves.toMatchObject({
      isCoding: true,
      statsStale: true,
      todayDate: "2026-08-09",
      todayText: null,
      lastActiveAt: "2026-08-09T11:59:30.000Z",
    });
  });

  it("rejects an unavailable authenticated user response", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ error: "unauthorized" }, 401));
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchWakaTimeStatus("bad-key", now)).rejects.toThrow(
      "WakaTime user endpoint responded 401",
    );
  });

  it("falls back to the profile timestamp when heartbeats are unavailable", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        jsonResponse({
          data: {
            last_heartbeat_at: "2026-08-09T11:59:00.000Z",
            timezone: "Africa/Lagos",
          },
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({ data: { grand_total: { text: "1 min" } } }),
      )
      .mockRejectedValueOnce(new Error("heartbeats unavailable"))
      .mockResolvedValueOnce(jsonResponse(emptyWeek));
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchWakaTimeStatus("waka_secret", now)).resolves.toEqual({
      isCoding: true,
      statsStale: false,
      todayDate: "2026-08-09",
      todayText: "1 min",
      ...emptyActivity,
      lastActiveAt: "2026-08-09T11:59:00.000Z",
      checkedAt: now.toISOString(),
    });
  });
});

describe("WakaTime public status cache", () => {
  it("coalesces concurrent refreshes and reuses the cached result", async () => {
    vi.resetModules();
    vi.stubEnv("WAKATIME_API_KEY", "waka_secret");
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        jsonResponse({
          data: {
            last_heartbeat_at: "2026-08-09T11:59:00.000Z",
            timezone: "Africa/Lagos",
          },
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({ data: { grand_total: { text: "1 min" } } }),
      )
      .mockResolvedValueOnce(jsonResponse({ data: [] }))
      .mockResolvedValueOnce(jsonResponse(emptyWeek));
    vi.stubGlobal("fetch", fetchMock);
    const { getPublicWakaTimeStatus } = await import("@/lib/wakatime/server");

    const [first, concurrent] = await Promise.all([
      getPublicWakaTimeStatus(),
      getPublicWakaTimeStatus(),
    ]);
    const cached = await getPublicWakaTimeStatus();

    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(concurrent).toEqual(first);
    expect(cached).toEqual(first);
  });

  it("keeps weekly stats but clears yesterday's total during an outage", async () => {
    vi.resetModules();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-09T22:59:30.000Z"));
    vi.stubEnv("WAKATIME_API_KEY", "waka_secret");
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        jsonResponse({
          data: {
            last_heartbeat_at: "2026-08-09T22:59:00.000Z",
            timezone: "Africa/Lagos",
          },
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          data: {
            grand_total: { text: "2 hrs", total_seconds: 7_200 },
          },
        }),
      )
      .mockResolvedValueOnce(jsonResponse({ data: [] }))
      .mockResolvedValueOnce(
        jsonResponse({
          end: "2026-08-09T23:59:59Z",
          data: [
            {
              range: { date: "2026-08-09" },
              grand_total: { total_seconds: 7_200 },
              languages: [{ name: "TypeScript", total_seconds: 7_200 }],
            },
          ],
        }),
      )
      .mockRejectedValueOnce(new Error("WakaTime unavailable"));
    vi.stubGlobal("fetch", fetchMock);
    const { getPublicWakaTimeStatus } = await import("@/lib/wakatime/server");

    await getPublicWakaTimeStatus();
    vi.advanceTimersByTime(61_000);
    const fallback = await getPublicWakaTimeStatus();

    expect(fallback).toMatchObject({
      isCoding: true,
      statsStale: true,
      todayDate: "2026-08-10",
      todayText: null,
      todaySeconds: null,
      weekSeconds: 7_200,
      dailyAverageSeconds: 7_200,
      topLanguage: { name: "TypeScript", percent: 100 },
      lastActiveAt: "2026-08-09T22:59:00.000Z",
    });
  });

  it("returns an inactive status when WakaTime is not configured", async () => {
    vi.resetModules();
    vi.stubEnv("WAKATIME_API_KEY", "");
    const { getPublicWakaTimeStatus } = await import("@/lib/wakatime/server");

    await expect(getPublicWakaTimeStatus()).resolves.toMatchObject({
      isCoding: false,
      statsStale: true,
      todayDate: null,
      todaySeconds: null,
      weekSeconds: null,
      days: [],
    });
  });
});
