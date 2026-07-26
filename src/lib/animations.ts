import type { TargetAndTransition, Variants } from "motion/react";

/**
 * Global motion system — all durations, easing, and reusable variants live
 * here so animation feels consistent across every page.
 *
 * Rules: 60fps-friendly properties only (opacity / transform), fast and
 * intentional timing, `prefers-reduced-motion` respected via MotionProvider.
 */

/** Signature ease — smooth, expensive-feeling deceleration. */
export const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

export const DURATION = {
  /** Micro interactions (hovers, taps). */
  micro: 0.18,
  /** Card hover transitions. */
  hover: 0.32,
  /** Scroll-reveal of sections. */
  reveal: 0.72,
  /** Hero entrance. */
  hero: 0.92,
} as const;

/* ---------------------------------------------------------------- */
/* Reveal variants                                                   */
/* ---------------------------------------------------------------- */

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.985 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: DURATION.reveal, ease: EASE },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: DURATION.reveal, ease: EASE } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.92, y: 12 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.55, ease: EASE },
  },
};

export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -32 },
  visible: { opacity: 1, x: 0, transition: { duration: DURATION.reveal, ease: EASE } },
};

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 32 },
  visible: { opacity: 1, x: 0, transition: { duration: DURATION.reveal, ease: EASE } },
};

/** Parent orchestrator — children with their own variants stagger in. */
export const staggerContainer = (stagger = 0.08, delay = 0): Variants => ({
  hidden: {},
  visible: { transition: { staggerChildren: stagger, delayChildren: delay } },
});

/* ---------------------------------------------------------------- */
/* Interaction presets                                               */
/* ---------------------------------------------------------------- */

export const cardHover: TargetAndTransition = {
  y: -7,
  scale: 1.012,
  transition: { type: "spring", stiffness: 280, damping: 22, mass: 0.7 },
};

export const buttonHover: TargetAndTransition = {
  y: -2,
  scale: 1.01,
  transition: { type: "spring", stiffness: 360, damping: 24, mass: 0.55 },
};

export const pageTransition = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: EASE },
};

/* ---------------------------------------------------------------- */
/* Variant factory (used by <Reveal /> and <StaggerItem />)          */
/* ---------------------------------------------------------------- */

export type RevealVariantName =
  | "fadeUp"
  | "fadeIn"
  | "scaleIn"
  | "slideInLeft"
  | "slideInRight"
  | "drawLine";

export function createVariant(
  name: RevealVariantName,
  { delay = 0, duration = DURATION.reveal }: { delay?: number; duration?: number } = {},
): Variants {
  const transition = { duration, ease: EASE, delay };
  switch (name) {
    case "fadeIn":
      return { hidden: { opacity: 0 }, visible: { opacity: 1, transition } };
    case "scaleIn":
      return {
        hidden: { opacity: 0, scale: 0.92, y: 12 },
        visible: { opacity: 1, scale: 1, y: 0, transition },
      };
    case "slideInLeft":
      return {
        hidden: { opacity: 0, x: -32 },
        visible: { opacity: 1, x: 0, transition },
      };
    case "slideInRight":
      return {
        hidden: { opacity: 0, x: 32 },
        visible: { opacity: 1, x: 0, transition },
      };
    case "drawLine":
      return {
        hidden: { scaleX: 0 },
        visible: { scaleX: 1, transition: { ...transition, duration: 0.9 } },
      };
    case "fadeUp":
    default:
      return {
        hidden: { opacity: 0, y: 30, scale: 0.985 },
        visible: { opacity: 1, y: 0, scale: 1, transition },
      };
  }
}
