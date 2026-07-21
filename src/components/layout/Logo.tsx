import { cx } from "@/lib/cx";
import styles from "./Logo.module.css";

type LogoProps = {
  size?: "sm" | "md";
  className?: string;
};

/**
 * Brand lockup: the Vezvora "V" mark + wordmark.
 *
 * The mark lives at `public/logo-mark.webp`. To swap in a different brand asset,
 * drop the file in `public/` and point the `src` below at it — everything else
 * stays the same.
 */
export function Logo({ size = "md", className }: LogoProps) {
  return (
    <span className={cx(styles.logo, size === "sm" && styles.sm, className)}>
      <span className={styles.markFrame} aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-mark.webp"
          alt=""
          width={720}
          height={580}
          className={styles.mark}
        />
      </span>
      <span className={styles.word}>
        VEZ<span className={styles.grad}>VORA</span>
      </span>
    </span>
  );
}
