"use client";

import type { ReactNode } from "react";
import { MotionConfig } from "motion/react";

/**
 * App-wide motion configuration. `reducedMotion="user"` disables transform
 * animations (keeping only safe opacity fades) for users who have
 * prefers-reduced-motion enabled.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
