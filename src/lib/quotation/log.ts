/**
 * Structured application logging for the quotation workflow.
 *
 * One JSON line per event so Vercel's log drain can filter on `event`,
 * `quotationId` or `outcome` without regex-scraping prose.
 */

type Level = "info" | "warn" | "error";
type Fields = Record<string, string | number | boolean | null | undefined>;

function emit(level: Level, event: string, fields: Fields = {}): void {
  const entry = JSON.stringify({
    scope: "quotation",
    level,
    event,
    at: new Date().toISOString(),
    ...fields,
  });
  if (level === "error") console.error(entry);
  else if (level === "warn") console.warn(entry);
  else console.info(entry);
}

export const log = {
  info: (event: string, fields?: Fields) => emit("info", event, fields),
  warn: (event: string, fields?: Fields) => emit("warn", event, fields),
  error: (event: string, fields?: Fields) => emit("error", event, fields),
};

/** Never leak provider or stack detail to a public caller. */
export function safeErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}
