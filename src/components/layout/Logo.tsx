import { cx } from "@/lib/cx";
import styles from "./Logo.module.css";

type LogoProps = {
  size?: "sm" | "md";
  className?: string;
};

/**
 * Brand lockup: the Vezvora "V" mark + wordmark.
 *
 * The mark lives at `public/logo.svg`. To use the exact brand raster instead,
 * drop the file in `public/` and point the `src` below at it (e.g. `/vezvora.png`) —
 * everything else stays the same.
 */
export function Logo({ size = "md", className }: LogoProps) {
  return (
    <span className={cx(styles.logo, size === "sm" && styles.sm, className)}>
      {/* Brand "V" mark, cropped from the supplied lockup (public/logo.png). */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-mark.png"
        alt=""
        aria-hidden="true"
        width={720}
        height={580}
        className={styles.mark}
      />
      <span className={styles.word}>
        VEZ<span className={styles.grad}>VORA</span>
      </span>
    </span>
  );
}
