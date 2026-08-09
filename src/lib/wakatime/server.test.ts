import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { fetchWakaTimeStatus } from "@/lib/wakatime/server";

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
});

describe("WakaTime server client", () => {
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
      todayDate: "2026-08-09",
      todayText: null,
      ...emptyActivity,
      lastActiveAt: "2026-08-09T11:59:30.000Z",
      checkedAt: now.toISOString(),
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
      todayDate: "2026-08-09",
      todayText: "1 min",
      ...emptyActivity,
      lastActiveAt: "2026-08-09T11:59:00.000Z",
      checkedAt: now.toISOString(),
    });
  });
});
