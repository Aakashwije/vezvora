"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { pageTransition } from "@/lib/animations";

/**
 * Route transition — re-mounts on navigation, fading page content up.
 * Fast and subtle; the shared navbar/footer stay put. The admin console
 * manages its own layout, so it is excluded (keeps the sidebar persistent).
 */
export default function Template({ children }: { children: ReactNode }) {
  const reduceMotion = useReducedMotion();
  const pathname = usePathname();

  if (pathname?.startsWith("/admin")) {
    return <>{children}</>;
  }

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
