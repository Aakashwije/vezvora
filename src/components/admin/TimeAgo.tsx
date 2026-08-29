"use client";

import { useSyncExternalStore } from "react";
import { formatDateTime, relativeTime } from "@/lib/admin/format";

/**
 * Hydration-safe relative timestamp.
 *
 * "3m ago" depends on the current time, so rendering it during SSR guarantees a
 * mismatch when the client hydrates a minute later. The server snapshot is an
 * absolute, timezone-fixed date; once mounted, a shared per-minute clock swaps
 * in the relative form.
 */
let snapshot = 0;
let interval: ReturnType<typeof setInterval> | null = null;
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (!interval) {
    snapshot = Date.now();
    interval = setInterval(() => {
      snapshot = Date.now();
      for (const notify of listeners) notify();
    }, 30_000);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && interval) {
      clearInterval(interval);
      interval = null;
    }
  };
}

function getSnapshot(): number {
  if (snapshot === 0) snapshot = Date.now();
  return snapshot;
}

function getServerSnapshot(): number | null {
  return null;
}

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
  const now = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (now === null) {
    return <time dateTime={iso}>{absolute(iso)}</time>;
  }
  return (
    <time dateTime={iso} title={formatDateTime(iso)}>
      {relativeTime(iso)}
    </time>
  );
}
