"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

type LiveMetricProps = {
  base: number;
  /** Max random deviation from `base` while streaming. */
  jitter: number;
  format: (v: number) => string;
  active: boolean;
  className?: string;
};

/**
 * Dashboard readout that streams new values upward like a live network
 * feed while `active`, and rests at its base value otherwise. Pass the
 * typography via `className`; the clipping/stacking styles are built in.
 */
export function LiveMetric({
  base,
  jitter,
  format,
  active,
  className,
}: LiveMetricProps) {
  const [streamed, setStreamed] = useState<string | null>(null);

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => {
      setStreamed(format(base + (Math.random() * 2 - 1) * jitter));
    }, 180);
    return () => {
      clearInterval(id);
      setStreamed(null);
    };
  }, [active, base, jitter, format]);

  // Rest at the base value; only show streamed readings while hovered.
  const display = (active && streamed) || format(base);

  return (
    <span
      className={className}
      style={{
        display: "block",
        overflow: "hidden",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={display}
          style={{ display: "inline-block" }}
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -8, opacity: 0 }}
          transition={{ duration: 0.16, ease: "easeOut" }}
        >
          {display}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
