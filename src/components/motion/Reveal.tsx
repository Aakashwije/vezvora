"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";
import { createVariant, type RevealVariantName } from "@/lib/animations";

const tags = {
  div: motion.div,
  span: motion.span,
  section: motion.section,
} as const;

type RevealProps = {
  children?: ReactNode;
  variant?: RevealVariantName;
  delay?: number;
  duration?: number;
  className?: string;
  as?: keyof typeof tags;
  /** "view" animates on scroll into view (default); "mount" on page load. */
  mode?: "view" | "mount";
  /** Portion of the element that must be visible before revealing. */
  amount?: number;
};

/**
 * Scroll/mount reveal wrapper. Animates once, using the shared variant
 * system from `lib/animations.ts`.
 */
export function Reveal({
  children,
  variant = "fadeUp",
  delay = 0,
  duration,
  className,
  as = "div",
  mode = "view",
  amount = 0.25,
}: RevealProps) {
  const Comp = tags[as];
  const variants = createVariant(variant, { delay, duration });
  const animationProps =
    mode === "mount"
      ? ({ initial: "hidden", animate: "visible" } as const)
      : ({
          initial: "hidden",
          whileInView: "visible",
          viewport: { once: true, amount },
        } as const);

  return (
    <Comp
      className={className}
      variants={variants}
      style={variant === "drawLine" ? { transformOrigin: "left" } : undefined}
      {...animationProps}
    >
      {children}
    </Comp>
  );
}
