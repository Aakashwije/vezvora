"use client";

import { useSyncExternalStore } from "react";

/**
 * Shared page clocks.
 *
 * One interval per tick rate for the whole page, rather than one per component:
 * a dashboard showing a dozen countdowns runs a single timer.
 *
 * Exposed through `useSyncExternalStore` rather than a `useEffect` + `setState`
 * pair. The server snapshot is `null`, so the first paint matches the server
 * exactly and React swaps in the live time after hydration — no mismatch, and
 * no cascading render. Callers render an absolute or placeholder value while
 * the snapshot is `null`.
 */
function createClock(intervalMs: number) {
  let snapshot = 0;
  let timer: ReturnType<typeof setInterval> | null = null;
  const listeners = new Set<() => void>();

  function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    if (!timer) {
      snapshot = Date.now();
      timer = setInterval(() => {
        snapshot = Date.now();
        for (const notify of listeners) notify();
      }, intervalMs);
    }
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0 && timer) {
        clearInterval(timer);
        timer = null;
      }
    };
  }

  function getSnapshot(): number {
    // Seed on the first client read so the value is correct immediately.
    if (snapshot === 0) snapshot = Date.now();
    return snapshot;
  }

  function getServerSnapshot(): number | null {
    return null;
  }

  return { subscribe, getSnapshot, getServerSnapshot };
}

const perSecond = createClock(1_000);
const perHalfMinute = createClock(30_000);

/** Live milliseconds, ticking every second. `null` until hydrated. */
export function useSecondClock(): number | null {
  return useSyncExternalStore(
    perSecond.subscribe,
    perSecond.getSnapshot,
    perSecond.getServerSnapshot,
  );
}

/** Live milliseconds, ticking every 30 seconds. `null` until hydrated. */
export function useCoarseClock(): number | null {
  return useSyncExternalStore(
    perHalfMinute.subscribe,
    perHalfMinute.getSnapshot,
    perHalfMinute.getServerSnapshot,
  );
}
