import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { fetchWakaTimeStatus } from "@/lib/wakatime/server";

const now = new Date("2026-08-09T12:00:00.000Z");

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
            last_heartbeat_at: "2026-08-09T11:58:00.000Z",
            last_project: "private-project",
            last_branch: "secret-branch",
          },
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({ data: { grand_total: { text: "2 hrs 8 mins" } } }),
      );
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchWakaTimeStatus("waka_secret", now)).resolves.toEqual({
      isCoding: true,
      todayText: "2 hrs 8 mins",
      checkedAt: now.toISOString(),
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
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
          data: { last_heartbeat_at: "2026-08-09T11:59:00.000Z" },
        }),
      )
      .mockResolvedValueOnce(jsonResponse({ error: "busy" }, 503));
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchWakaTimeStatus("waka_secret", now)).resolves.toEqual({
      isCoding: true,
      todayText: null,
      checkedAt: now.toISOString(),
    });
  });

  it("keeps live presence when today's summary request rejects", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        jsonResponse({
          data: { last_heartbeat_at: "2026-08-09T11:59:00.000Z" },
        }),
      )
      .mockRejectedValueOnce(new Error("summary unavailable"));
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchWakaTimeStatus("waka_secret", now)).resolves.toEqual({
      isCoding: true,
      todayText: null,
      checkedAt: now.toISOString(),
    });
  });

  it("rejects an unavailable authenticated user response", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ error: "unauthorized" }, 401))
      .mockResolvedValueOnce(
        jsonResponse({ data: { grand_total: { text: "" } } }),
      );
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchWakaTimeStatus("bad-key", now)).rejects.toThrow(
      "WakaTime user endpoint responded 401",
    );
  });
});
