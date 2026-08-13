import "server-only";

import { asc, eq, gte, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { agentCompactions, agentRuns } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/server";

export type TokenPeriod = {
  runs: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
};

export type TokenAnalytics = {
  today: TokenPeriod;
  month: TokenPeriod;
  allTime: TokenPeriod;
  failedRuns: number;
  daily: Array<TokenPeriod & { day: string }>;
  models: Array<TokenPeriod & { model: string }>;
  compaction: {
    count: number;
    sourceTokens: number;
    summaryTokens: number;
    reducedTokens: number;
  };
};

const lagosDayStart = sql<Date>`(
  date_trunc('day', timezone('Africa/Lagos', now()))
  at time zone 'Africa/Lagos'
)`;
const lagosMonthStart = sql<Date>`(
  date_trunc('month', timezone('Africa/Lagos', now()))
  at time zone 'Africa/Lagos'
)`;
const sevenDaysStart = sql<Date>`(
  (date_trunc('day', timezone('Africa/Lagos', now())) - interval '6 days')
  at time zone 'Africa/Lagos'
)`;
const dayExpression = sql<string>`to_char(timezone('Africa/Lagos', ${agentRuns.startedAt}), 'YYYY-MM-DD')`;

const runAggregate = {
  runs: sql<number>`count(*) filter (where ${agentRuns.status} = 'completed')::int`,
  inputTokens: sql<number>`coalesce(sum(${agentRuns.inputTokens}) filter (where ${agentRuns.status} = 'completed'), 0)::int`,
  outputTokens: sql<number>`coalesce(sum(${agentRuns.outputTokens}) filter (where ${agentRuns.status} = 'completed'), 0)::int`,
  totalTokens: sql<number>`coalesce(sum(coalesce(${agentRuns.inputTokens}, 0) + coalesce(${agentRuns.outputTokens}, 0)) filter (where ${agentRuns.status} = 'completed'), 0)::int`,
};

function dayKey(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );
  return `${value.year}-${value.month}-${value.day}`;
}

function recentDayKeys() {
  const today = new Date(`${dayKey(new Date())}T12:00:00Z`);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setUTCDate(today.getUTCDate() - (6 - index));
    return date.toISOString().slice(0, 10);
  });
}

function period(row: TokenPeriod | undefined): TokenPeriod {
  return row ?? { runs: 0, inputTokens: 0, outputTokens: 0, totalTokens: 0 };
}

export async function getBippyTokenAnalytics(): Promise<TokenAnalytics> {
  await requireAdmin();
  const db = getDb();
  const [
    allTimeRows,
    todayRows,
    monthRows,
    failedRows,
    dailyRows,
    modelRows,
    compactionRows,
  ] = await Promise.all([
    db.select(runAggregate).from(agentRuns),
    db
      .select(runAggregate)
      .from(agentRuns)
      .where(gte(agentRuns.startedAt, lagosDayStart)),
    db
      .select(runAggregate)
      .from(agentRuns)
      .where(gte(agentRuns.startedAt, lagosMonthStart)),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(agentRuns)
      .where(eq(agentRuns.status, "failed")),
    db
      .select({ day: dayExpression, ...runAggregate })
      .from(agentRuns)
      .where(gte(agentRuns.startedAt, sevenDaysStart))
      .groupBy(dayExpression)
      .orderBy(asc(dayExpression)),
    db
      .select({ model: agentRuns.model, ...runAggregate })
      .from(agentRuns)
      .where(eq(agentRuns.status, "completed"))
      .groupBy(agentRuns.model)
      .orderBy(
        sql`sum(coalesce(${agentRuns.inputTokens}, 0) + coalesce(${agentRuns.outputTokens}, 0)) desc`,
      ),
    db
      .select({
        count: sql<number>`count(*)::int`,
        sourceTokens: sql<number>`coalesce(sum(${agentCompactions.sourceTokens}), 0)::int`,
        summaryTokens: sql<number>`coalesce(sum(${agentCompactions.summaryTokens}), 0)::int`,
      })
      .from(agentCompactions),
  ]);

  const dailyByDay = new Map(dailyRows.map((row) => [row.day, row]));
  const daily = recentDayKeys().map((day) => ({
    day,
    ...period(dailyByDay.get(day)),
  }));
  const compaction = compactionRows[0] ?? {
    count: 0,
    sourceTokens: 0,
    summaryTokens: 0,
  };

  return {
    today: period(todayRows[0]),
    month: period(monthRows[0]),
    allTime: period(allTimeRows[0]),
    failedRuns: failedRows[0]?.count ?? 0,
    daily,
    models: modelRows.map((row) => ({ ...row })),
    compaction: {
      ...compaction,
      reducedTokens: Math.max(
        0,
        compaction.sourceTokens - compaction.summaryTokens,
      ),
    },
  };
}
