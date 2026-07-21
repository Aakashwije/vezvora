import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import styles from "./status.module.css";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <main className={styles.wrap}>
      <div className={styles.blob} aria-hidden />
      <div className={`container ${styles.inner}`}>
        <span className={styles.code}>
          4<span className="gradientText">0</span>4
        </span>
        <p className={styles.eyebrow}>Lost signal</p>
        <h1 className={styles.title}>This page took a wrong turn.</h1>
        <p className={styles.text}>
          The page you&apos;re looking for doesn&apos;t exist or has moved.
          Let&apos;s get you back on the path.
        </p>
        <div className={styles.actions}>
          <Button href="/" variant="accent" icon="arrow_forward">
            Back to home
          </Button>
          <Button href="/contact" variant="outline">
            Talk to us
          </Button>
        </div>
      </div>
    </main>
  );
}
