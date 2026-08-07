type LogLevel = "info" | "warn" | "error";

export function logServer(
  level: LogLevel,
  event: string,
  details: Record<string, unknown> = {},
) {
  const entry = JSON.stringify({
    level,
    event,
    at: new Date().toISOString(),
    ...details,
  });
  console[level](entry);
}
