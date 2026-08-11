import { describe, expect, it, vi } from "vitest";
import { createRetryingFetch, isReadOnlyRequest } from "@/db/retry";

const body = (query: string) => JSON.stringify({ query, params: [] });
const batch = (...queries: string[]) =>
  JSON.stringify({ queries: queries.map((query) => ({ query, params: [] })) });

const noSleep = () => Promise.resolve();

describe("isReadOnlyRequest", () => {
  it("accepts a plain select", () => {
    expect(isReadOnlyRequest(body('select "id" from "projects"'))).toBe(true);
  });

  it("accepts a batch of selects", () => {
    expect(isReadOnlyRequest(batch("select 1", "select 2"))).toBe(true);
  });

  it("rejects writes", () => {
    for (const sql of [
      'insert into "now_links" values ($1)',
      'update "projects" set "title" = $1',
      'delete from "projects" where "id" = $1',
    ]) {
      expect(isReadOnlyRequest(body(sql))).toBe(false);
    }
  });

  it("rejects a batch where any statement writes", () => {
    expect(isReadOnlyRequest(batch("select 1", "delete from x"))).toBe(false);
  });

  // A CTE opens with `with`, so a prefix check alone would wave this through.
  it("rejects a CTE that ends in a mutation", () => {
    expect(
      isReadOnlyRequest(
        body(
          "with removed as (delete from x returning id) select * from removed",
        ),
      ),
    ).toBe(false);
  });

  // Each of these opens with SELECT and still changes something when replayed:
  // a sequence advanced, a notification delivered, a table created, a row
  // locked.
  it("rejects reads that carry a side effect", () => {
    for (const sql of [
      "select nextval('projects_id_seq')",
      "select setval('projects_id_seq', 1)",
      "select pg_notify('channel', 'payload')",
      "select pg_advisory_lock(1)",
      'select * into "archive" from "projects"',
      'select * from "projects" for update',
      'select * from "projects" for no key update',
      'select * from "projects" for share',
    ]) {
      expect(isReadOnlyRequest(body(sql))).toBe(false);
    }
  });

  it("fails closed on anything it cannot read", () => {
    expect(isReadOnlyRequest("not json")).toBe(false);
    expect(isReadOnlyRequest(undefined)).toBe(false);
    expect(isReadOnlyRequest(JSON.stringify({}))).toBe(false);
  });
});

describe("createRetryingFetch", () => {
  const ok = new Response("{}", { status: 200 });

  it("retries a read that fails to connect, and succeeds", async () => {
    const impl = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("fetch failed"))
      .mockResolvedValueOnce(ok);
    const retrying = createRetryingFetch(impl as unknown as typeof fetch, {
      sleep: noSleep,
    });

    await expect(
      retrying("https://db", { body: body("select 1") }),
    ).resolves.toBe(ok);
    expect(impl).toHaveBeenCalledTimes(2);
  });

  // The whole point of the read-only gate: a lost response on a write may mean
  // the row was already created, so replaying it would create a second one.
  it("never retries a write", async () => {
    const impl = vi.fn().mockRejectedValue(new TypeError("fetch failed"));
    const retrying = createRetryingFetch(impl as unknown as typeof fetch, {
      sleep: noSleep,
    });

    await expect(
      retrying("https://db", { body: body("insert into x values (1)") }),
    ).rejects.toThrow("fetch failed");
    expect(impl).toHaveBeenCalledTimes(1);
  });

  it("does not retry an HTTP error, which is the database answering", async () => {
    const conflict = new Response("constraint violation", { status: 400 });
    const impl = vi.fn().mockResolvedValue(conflict);
    const retrying = createRetryingFetch(impl as unknown as typeof fetch, {
      sleep: noSleep,
    });

    await expect(
      retrying("https://db", { body: body("select 1") }),
    ).resolves.toBe(conflict);
    expect(impl).toHaveBeenCalledTimes(1);
  });

  it("gives up after the configured attempts and rethrows the last error", async () => {
    const impl = vi.fn().mockRejectedValue(new TypeError("fetch failed"));
    const onRetry = vi.fn();
    const retrying = createRetryingFetch(impl as unknown as typeof fetch, {
      attempts: 3,
      sleep: noSleep,
      onRetry,
    });

    await expect(
      retrying("https://db", { body: body("select 1") }),
    ).rejects.toThrow("fetch failed");
    expect(impl).toHaveBeenCalledTimes(3);
    expect(onRetry).toHaveBeenCalledTimes(2);
  });

  // Otherwise the loop body never runs and the caller is rejected with
  // undefined, which looks nothing like a database failure.
  it("refuses an attempt count that would skip the request", () => {
    for (const attempts of [0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() =>
        createRetryingFetch(vi.fn() as unknown as typeof fetch, { attempts }),
      ).toThrow(RangeError);
    }
  });

  it("backs off further on each successive attempt", async () => {
    const impl = vi.fn().mockRejectedValue(new TypeError("fetch failed"));
    const waits: number[] = [];
    const retrying = createRetryingFetch(impl as unknown as typeof fetch, {
      attempts: 3,
      sleep: async (ms) => {
        waits.push(ms);
      },
    });

    await expect(
      retrying("https://db", { body: body("select 1") }),
    ).rejects.toThrow();
    expect(waits).toHaveLength(2);
    expect(waits[1]).toBeGreaterThan(waits[0]);
  });
});
