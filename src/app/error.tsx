"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import styles from "./status.module.css";

/**
 * Root error boundary. Renders for uncaught errors in the route tree and
 * exposes a reset() to retry the failed render.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface the error for local debugging / any wired-up reporting.
    console.error(error);
  }, [error]);

  return (
    <main className={styles.wrap}>
      <div className={styles.blob} aria-hidden />
      <div className={`container ${styles.inner}`}>
        <span className={styles.code}>
          <span className="gradientText">!</span>
        </span>
        <p className={styles.eyebrow}>Something broke</p>
        <h1 className={styles.title}>An unexpected error occurred.</h1>
        <p className={styles.text}>
          Our team has been notified. You can try again, or head back home and
          pick up where you left off.
        </p>
        <div className={styles.actions}>
          <Button onClick={() => reset()} variant="accent" icon="arrow_forward">
            Try again
          </Button>
          <Button href="/" variant="outline">
            Back to home
          </Button>
        </div>
      </div>
    </main>
  );
}
