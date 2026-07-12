import type { ReactNode } from "react";
import { cx } from "@/lib/cx";
import styles from "./Eyebrow.module.css";

type EyebrowProps = {
  children: ReactNode;
  /** "light" tone is used on dark backgrounds. */
  tone?: "green" | "light";
  className?: string;
};

export function Eyebrow({ children, tone = "green", className }: EyebrowProps) {
  return (
    <span className={cx(styles.eyebrow, styles[tone], className)}>
      {children}
    </span>
  );
}
