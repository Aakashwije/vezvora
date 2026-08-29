"use client";

import { useSyncExternalStore } from "react";
import { cx } from "@/lib/cx";
import { isAwaitingAutoSend } from "@/lib/quotation/status-meta";
import type { QuotationStatus } from "@/lib/quotation/types";
import styles from "./quotations.module.css";

/**
 * One shared per-second clock for every countdown on the page.
 *
 * Exposed through `useSyncExternalStore` rather than a `useEffect` + `setState`
 * pair: the server snapshot is `null`, so the first paint matches the server
 * exactly and React swaps in the live time after hydration — no mismatch and no
 * cascading render.
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
    }, 1000);
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
  // Seed on the first client read so the countdown is correct immediately.
  if (snapshot === 0) snapshot = Date.now();
  return snapshot;
}

function getServerSnapshot(): number | null {
  return null;
}

function format(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

type Props = {
  deadline: string;
  status: QuotationStatus;
  /** Compact form for table cells. */
  compact?: boolean;
};

/** Live review-window countdown shown in the list and on the detail page. */
export function QuotationCountdown({ deadline, status, compact }: Props) {
  const now = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (!isAwaitingAutoSend(status)) {
    return <span className={cx(styles.countdown, styles.countdownIdle)}>—</span>;
  }

  if (now === null) {
    return <span className={cx(styles.countdown, styles.countdownIdle)}>--:--</span>;
  }

  const left = new Date(deadline).getTime() - now;
  if (left <= 0) {
    return (
      <span className={cx(styles.countdown, styles.countdownDue)}>
        {compact ? "Due" : "Sending shortly"}
      </span>
    );
  }

  const urgent = left <= 120_000;
  return (
    <span
      className={cx(styles.countdown, urgent && styles.countdownUrgent)}
      title={`Auto-sends at ${new Date(deadline).toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      })}`}
    >
      <span className={styles.countdownDot} aria-hidden />
      {format(left)}
      {!compact && <span className={styles.countdownLabel}>until auto-send</span>}
    </span>
  );
}
