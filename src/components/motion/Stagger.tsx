"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";
import {
  cardHover,
  createVariant,
  staggerContainer,
  type RevealVariantName,
} from "@/lib/animations";

const tags = {
  div: motion.div,
  span: motion.span,
  section: motion.section,
  article: motion.article,
} as const;

type StaggerProps = {
  children: ReactNode;
  className?: string;
  /** Delay between each child, in seconds. */
  stagger?: number;
  delay?: number;
  as?: keyof typeof tags;
  mode?: "view" | "mount";
  amount?: number;
};

/** Orchestrates staggered reveals — children must be `StaggerItem`s. */
export function Stagger({
  children,
  className,
  stagger = 0.08,
  delay = 0,
  as = "div",
  mode = "view",
  amount = 0.15,
}: StaggerProps) {
  const Comp = tags[as];
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
      variants={staggerContainer(stagger, delay)}
      {...animationProps}
    >
      {children}
    </Comp>
  );
}

type StaggerItemProps = {
  children: ReactNode;
  className?: string;
  variant?: RevealVariantName;
  duration?: number;
  as?: keyof typeof tags;
  /** Adds a smooth hover lift (used for cards). */
  hoverLift?: boolean;
};

export function StaggerItem({
  children,
  className,
  variant = "fadeUp",
  duration,
  as = "div",
  hoverLift = false,
}: StaggerItemProps) {
  const Comp = tags[as];
  return (
    <Comp
      className={className}
      variants={createVariant(variant, { duration })}
      whileHover={hoverLift ? cardHover : undefined}
    >
      {children}
    </Comp>
  );
}
