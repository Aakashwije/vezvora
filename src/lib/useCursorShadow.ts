"use client";

import type { MouseEvent } from "react";
import { useMotionTemplate, useMotionValue, useSpring, useTransform } from "motion/react";

type CursorShadowOptions = {
  /** Max the shadow shifts toward the cursor, in px. */
  reach?: number;
  blur?: number;
  spread?: number;
  /** "r, g, b" channel string. */
  color?: string;
  maxAlpha?: number;
  ringAlpha?: number;
};

/**
 * Drives a green outer box-shadow, cast around a card, that leans toward the
 * cursor while hovered and fades in/out via a spring (never toggled on/off
 * via the style prop, which can leave a stale shadow on the DOM node).
 */
export function useCursorShadow({
  reach = 26,
  blur = 46,
  spread = -6,
  color = "40, 184, 95",
  maxAlpha = 0.55,
  ringAlpha = 0.22,
}: CursorShadowOptions = {}) {
  const sx = useMotionValue(0);
  const sy = useMotionValue(0);
  const shadowX = useSpring(sx, { stiffness: 150, damping: 20 });
  const shadowY = useSpring(sy, { stiffness: 150, damping: 20 });

  const t = useMotionValue(0);
  const tSpring = useSpring(t, { stiffness: 150, damping: 20 });
  const shadowAlpha = useTransform(tSpring, (v) => v * maxAlpha);
  const shadowRingAlpha = useTransform(tSpring, (v) => v * ringAlpha);

  const boxShadow = useMotionTemplate`${shadowX}px ${shadowY}px ${blur}px ${spread}px rgba(${color}, ${shadowAlpha}), 0 0 0 1px rgba(${color}, ${shadowRingAlpha})`;

  const onMouseMove = (e: MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    sx.set((px - 0.5) * 2 * reach);
    sy.set((py - 0.5) * 2 * reach);
  };

  const onMouseEnter = () => t.set(1);

  const onMouseLeave = () => {
    t.set(0);
    sx.set(0);
    sy.set(0);
  };

  return { boxShadow, onMouseMove, onMouseEnter, onMouseLeave };
}
