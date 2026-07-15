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
 * feeds an underdamped spring, so the element squashes and stretches while
 * scrolling and keeps jiggling like liquid for a moment after the scroll
 * stops. The deformation is centered, so all four corners of the tile move
 * by the same amount. Disabled for users with prefers-reduced-motion.
 */
export function LiquidWobble({ children, className, intensity = 1 }: LiquidWobbleProps) {
  const reduceMotion = useReducedMotion();
  const { scrollY } = useScroll();
  const velocity = useVelocity(scrollY);

  // Lightly underdamped: one soft overshoot and a quick settle, like the
  // surface of water coming to rest — not repeated jelly oscillation. The
  // second, slightly stiffer spring drives the positional drift out of phase
  // with the squash so it still reads as liquid rather than a rigid shake.
  const wobble = useSpring(velocity, { stiffness: 210, damping: 16, mass: 1.1 });
  const bounce = useSpring(velocity, { stiffness: 300, damping: 20, mass: 1 });

  // Guard against zero/negative/non-finite intensity, which would make the
  // transform input range invalid (non-ascending or NaN/Infinity).
  const safeIntensity = Number.isFinite(intensity) && intensity > 0 ? intensity : 1;
  const range = 2000 / safeIntensity;
  // Stretch along the scroll axis, squash across it (volume-preserving, like
  // a droplet being pulled). Scaling from the exact center keeps the
  // deformation identical at every corner — no skew or rotation, which would
  // pull one side further than the other.
  const scaleY = useTransform(wobble, [-range, 0, range], [1.045, 1, 1.045]);
  const scaleX = useTransform(wobble, [-range, 0, range], [0.965, 1, 0.965]);
  // Small vertical lag: the tile trails the scroll and springs back, like
  // liquid catching up with its container. Pure translation, so corners stay
  // in lockstep.
  const y = useTransform(bounce, [-range, range], [7, -7]);

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      style={{ scaleX, scaleY, y, transformOrigin: "50% 50%", position: "relative" }}
    >
      {children}
    </motion.div>
  );
}
