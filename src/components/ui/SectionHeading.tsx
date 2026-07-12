import type { CSSProperties, ReactNode } from "react";
import { cx } from "@/lib/cx";
import { Eyebrow } from "./Eyebrow";
import styles from "./SectionHeading.module.css";

type SectionHeadingProps = {
  eyebrow?: string;
  title: ReactNode;
  intro?: ReactNode;
  align?: "left" | "center";
  tone?: "light" | "dark";
  /** Constrains the width of the heading block. */
  maxWidth?: number;
  className?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  intro,
  align = "left",
  tone = "light",
  maxWidth,
  className,
}: SectionHeadingProps) {
  const style: CSSProperties | undefined = maxWidth ? { maxWidth } : undefined;

  return (
    <div
      className={cx(
        styles.wrap,
        align === "center" && styles.center,
        tone === "dark" && styles.dark,
        className,
      )}
      style={style}
    >
      {eyebrow && (
        <Eyebrow tone={tone === "dark" ? "light" : "green"}>{eyebrow}</Eyebrow>
      )}
      <h2 className={styles.title}>{title}</h2>
      {intro && <p className={styles.intro}>{intro}</p>}
    </div>
  );
}
