"use client";

import { useCoarseClock } from "./clock";
import { formatDateTime, relativeTime } from "@/lib/admin/format";

/**
 * Hydration-safe relative timestamp.
 *
 * "3m ago" depends on the current time, so rendering it during SSR guarantees a
 * mismatch when the client hydrates a minute later. The server snapshot is an
 * absolute, timezone-fixed date; once mounted, the shared per-minute clock
 * swaps in the relative form.
 */

/** Absolute date in UTC — identical on the server and in every browser. */
function absolute(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
}

export function TimeAgo({ iso }: { iso: string }) {
  const now = useCoarseClock();

  if (now === null) {
    return <time dateTime={iso}>{absolute(iso)}</time>;
  }
  return (
    <time dateTime={iso} title={formatDateTime(iso)}>
      {relativeTime(iso)}
    </time>
  );
}
