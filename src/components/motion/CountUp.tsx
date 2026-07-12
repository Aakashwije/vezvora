"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useInView, useReducedMotion } from "motion/react";
import { EASE } from "@/lib/animations";

type CountUpProps = {
  /** Display value, e.g. "140+", "98%", "$4.1M", "4.9". */
  value: string;
  duration?: number;
  className?: string;
};

/**
 * Counts a stat up from 0 the first time it scrolls into view.
 * Server-renders the final value (SEO/no-JS safe); never loops.
 * Non-numeric values (e.g. "Let's talk") render unchanged.
 */
export function CountUp({ value, duration = 1.4, className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduceMotion = useReducedMotion();
  const [text, setText] = useState(value);

  useEffect(() => {
    if (!inView || reduceMotion) return;

    const match = value.match(/^([^\d]*)([\d.,]+)(.*)$/);
    if (!match) return;
    const [, prefix, rawNumber, suffix] = match;
    const target = parseFloat(rawNumber.replace(/,/g, ""));
    if (Number.isNaN(target)) return;

    const decimals = (rawNumber.split(".")[1] ?? "").length;
    const grouped = rawNumber.includes(",");

    const controls = animate(0, target, {
      duration,
      ease: EASE,
      onUpdate: (latest) => {
        const formatted = grouped
          ? latest.toLocaleString("en-US", {
              minimumFractionDigits: decimals,
              maximumFractionDigits: decimals,
            })
          : latest.toFixed(decimals);
        setText(`${prefix}${formatted}${suffix}`);
      },
    });
    return () => controls.stop();
  }, [inView, reduceMotion, value, duration]);

  return (
    <span ref={ref} className={className}>
      {text}
    </span>
  );
}
