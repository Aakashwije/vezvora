"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { RANGE_PRESETS, type DateRange } from "@/lib/admin/dashboard";
import { cx } from "@/lib/cx";
import styles from "./dashboard.module.css";

const PRESET_LABEL: Record<string, string> = {
  "7d": "7 days",
  "30d": "30 days",
  "90d": "90 days",
};

/** `YYYY-MM-DD` for a date input, from an ISO bound. */
function dayValue(iso: string): string {
  return iso.slice(0, 10);
}

/**
 * Reporting period control.
 *
 * The range lives in the URL rather than in component state, so it survives a
 * refresh, can be linked to a colleague, and is read by the server component
 * that does the aggregation — no client-side recompute.
 */
export function DateRangeControl({ range }: { range: DateRange }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function apply(next: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value === null) params.delete(key);
      else params.set(key, value);
    }
    const query = params.toString();
    startTransition(() => {
      router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
    });
  }

  const customFrom = range.key === "custom" ? dayValue(range.from) : "";
  // The stored bound is exclusive; the control shows the inclusive last day.
  const customTo =
    range.key === "custom"
      ? dayValue(new Date(new Date(range.to).getTime() - 86_400_000).toISOString())
      : "";

  return (
    <div className={styles.range} data-pending={pending ? "" : undefined}>
      <div className={styles.rangeGroup} role="group" aria-label="Reporting period">
        {RANGE_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            className={cx(styles.rangeItem, range.key === preset && styles.rangeItemActive)}
            aria-pressed={range.key === preset}
            onClick={() => apply({ range: preset, from: null, to: null })}
          >
            {PRESET_LABEL[preset]}
          </button>
        ))}
        <button
          type="button"
          className={cx(styles.rangeItem, range.key === "custom" && styles.rangeItemActive)}
          aria-pressed={range.key === "custom"}
          onClick={() => {
            // Seed the pickers with the period currently on screen.
            const to = dayValue(new Date(new Date(range.to).getTime() - 86_400_000).toISOString());
            apply({ range: "custom", from: dayValue(range.from), to });
          }}
        >
          Custom
        </button>
      </div>

      {range.key === "custom" && (
        <div className={styles.rangeCustom}>
          <label>
            <span className={styles.srOnly}>From</span>
            <input
              type="date"
              className={styles.rangeDate}
              value={customFrom}
              max={customTo || undefined}
              onChange={(event) => apply({ range: "custom", from: event.target.value })}
            />
          </label>
          <span className={styles.rangeDash} aria-hidden>
            –
          </span>
          <label>
            <span className={styles.srOnly}>To</span>
            <input
              type="date"
              className={styles.rangeDate}
              value={customTo}
              min={customFrom || undefined}
              onChange={(event) => apply({ range: "custom", to: event.target.value })}
            />
          </label>
        </div>
      )}
    </div>
  );
}
