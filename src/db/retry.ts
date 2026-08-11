// The Neon HTTP driver sends each statement as its own fetch. A momentary
// network fault therefore fails a query outright, and getPublicPortfolio runs
// seven of them in one Promise.all — so one blip took the whole public site to
// its error boundary. Observed in the wild as:
//
//   NeonDbError: Error connecting to database: TypeError: fetch failed
//
// Retrying is only safe for reads. `fetch` rejecting does not tell us whether
// the request reached the server: it may have never left, or it may have run
// and had its response lost. Replaying a SELECT in the second case costs
// nothing; replaying an INSERT writes the row twice.

export type RetryOptions = {
  attempts?: number;
  delayMs?: (attempt: number) => number;
  onRetry?: (attempt: number, error: unknown) => void;
  sleep?: (ms: number) => Promise<void>;
};

const DEFAULT_ATTEMPTS = 3;
const defaultDelay = (attempt: number) => attempt * 150;
const defaultSleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

// Conservative by construction: anything we cannot positively identify as a
// read is treated as a write and never replayed. An unparseable body, a batch
// containing one mutation, a CTE that ends in INSERT — all fail closed.
export function isReadOnlyRequest(body: unknown): boolean {
  if (typeof body !== "string") return false;

  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    return false;
  }

  const statements = collectStatements(parsed);
  return statements.length > 0 && statements.every(isReadOnlyStatement);
}

function collectStatements(parsed: unknown): string[] {
  if (!parsed || typeof parsed !== "object") return [];

  const single = (parsed as { query?: unknown }).query;
  if (typeof single === "string") return [single];

  const batch = (parsed as { queries?: unknown }).queries;
  if (Array.isArray(batch)) {
    const queries = batch.map((entry) =>
      entry && typeof entry === "object"
        ? (entry as { query?: unknown }).query
        : undefined,
    );
    return queries.every((query): query is string => typeof query === "string")
      ? queries
      : [];
  }

  return [];
}

// Opening with SELECT does not make a statement side-effect free. These are
// the forms that read like a query and still change something when replayed:
// a sequence advanced, a notification delivered, a table created, a row
// locked. None of them appear in this codebase's queries, which are all
// Drizzle-generated reads — the guard is here because the retry sits at the
// driver, where it will meet whatever anyone writes later.
const SIDE_EFFECTING_READ =
  /\b(insert|update|delete|merge|truncate|alter|drop|create|into|nextval|setval|pg_notify|pg_advisory[a-z_]*|for\s+(update|share|no\s+key\s+update|key\s+share))\b/;

function isReadOnlyStatement(statement: string) {
  const sql = statement.trim().toLowerCase();
  if (!sql.startsWith("select") && !sql.startsWith("with ")) return false;
  // A CTE can still end in a mutation, and RETURNING hides one mid-statement.
  //
  // What this cannot see is a user-defined function that writes: SELECT
  // audit_and_return($1) is indistinguishable from any other call. Detecting
  // that needs the database's own read-only judgement, not string matching, so
  // the residual rule is the one this module opens with — anything with a
  // side effect must not be reached through a plain SELECT.
  return !SIDE_EFFECTING_READ.test(sql);
}

export function createRetryingFetch(
  fetchImpl: typeof fetch,
  options: RetryOptions = {},
): typeof fetch {
  const attempts = options.attempts ?? DEFAULT_ATTEMPTS;
  // Caught here rather than in the loop: a zero or negative count would skip
  // fetchImpl entirely and reject with undefined, turning a misconfiguration
  // into a database call that silently never happened.
  if (!Number.isSafeInteger(attempts) || attempts < 1) {
    throw new RangeError("attempts must be a positive integer");
  }
  const delayMs = options.delayMs ?? defaultDelay;
  const sleep = options.sleep ?? defaultSleep;

  return async function retryingFetch(input, init) {
    const retryable = isReadOnlyRequest(init?.body);
    let lastError: unknown;

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        // Only a rejection is retried. An HTTP error resolves normally and is
        // the database answering — a constraint violation must not be replayed.
        return await fetchImpl(input, init);
      } catch (error) {
        lastError = error;
        if (!retryable || attempt === attempts) break;
        options.onRetry?.(attempt, error);
        await sleep(delayMs(attempt));
      }
    }

    throw lastError;
  };
}
