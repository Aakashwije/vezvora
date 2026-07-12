"use client";

import type { ReactNode } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from "motion/react";

type LiquidWobbleProps = {
  children: ReactNode;
  className?: string;
  /** Overall distortion strength (1 = default). */
  intensity?: number;
};

/**
 * Wraps children in a scroll-reactive "water bubble" wobble. Scroll velocity
 * feeds an underdamped spring, so the element squashes, stretches, and skews
 * while scrolling and keeps jiggling like liquid for a moment after the
 * scroll stops. Disabled for users with prefers-reduced-motion.
 */
export function LiquidWobble({ children, className, intensity = 1 }: LiquidWobbleProps) {
  const reduceMotion = useReducedMotion();
  const { scrollY } = useScroll();
  const velocity = useVelocity(scrollY);

  // Low damping is what makes it feel like water: the spring overshoots and
  // oscillates a few times before settling.
  const wobble = useSpring(velocity, { stiffness: 320, damping: 7, mass: 1.2 });

  // Guard against zero/negative/non-finite intensity, which would make the
  // transform input range invalid (non-ascending or NaN/Infinity).
  const safeIntensity = Number.isFinite(intensity) && intensity > 0 ? intensity : 1;
  const range = 2400 / safeIntensity;
  // Stretch along the scroll axis, squash across it (volume-preserving,
  // like a droplet being pulled), plus a directional lean.
  const scaleY = useTransform(wobble, [-range, 0, range], [1.08, 1, 1.08]);
  const scaleX = useTransform(wobble, [-range, 0, range], [0.94, 1, 0.94]);
  const skewX = useTransform(wobble, [-range, range], [3.5, -3.5]);
  const rotate = useTransform(wobble, [-range, range], [0.8, -0.8]);

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      style={{ scaleX, scaleY, skewX, rotate, transformOrigin: "50% 60%", position: "relative" }}
    >
      {children}
    </motion.div>
  );
}
