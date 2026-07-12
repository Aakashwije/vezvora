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

  // Low damping is what makes it feel like water: the spring overshoots and
  // oscillates several times before settling. A second, slightly stiffer
  // spring drives the positional bounce out of phase with the squash, which
  // reads as liquid sloshing rather than a rigid shake.
  const wobble = useSpring(velocity, { stiffness: 240, damping: 5.5, mass: 1.4 });
  const bounce = useSpring(velocity, { stiffness: 360, damping: 8, mass: 1 });

  // Guard against zero/negative/non-finite intensity, which would make the
  // transform input range invalid (non-ascending or NaN/Infinity).
  const safeIntensity = Number.isFinite(intensity) && intensity > 0 ? intensity : 1;
  const range = 2000 / safeIntensity;
  // Stretch along the scroll axis, squash across it (volume-preserving, like
  // a droplet being pulled). Scaling from the exact center keeps the
  // deformation identical at every corner — no skew or rotation, which would
  // pull one side further than the other.
  const scaleY = useTransform(wobble, [-range, 0, range], [1.13, 1, 1.13]);
  const scaleX = useTransform(wobble, [-range, 0, range], [0.9, 1, 0.9]);
  // Small vertical lag: the tile trails the scroll and springs back, like
  // liquid catching up with its container. Pure translation, so corners stay
  // in lockstep.
  const y = useTransform(bounce, [-range, range], [14, -14]);

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
