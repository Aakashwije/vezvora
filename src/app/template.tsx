"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { pageTransition } from "@/lib/animations";

/**
 * Route transition — re-mounts on navigation, fading page content up.
 * Fast and subtle; the shared navbar/footer stay put.
 */
export default function Template({ children }: { children: ReactNode }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : pageTransition.initial}
      animate={pageTransition.animate}
      transition={pageTransition.transition}
    >
      {children}
    </motion.div>
  );
}
