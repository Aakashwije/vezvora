import styles from "./status.module.css";

/** Route-level loading fallback shown during navigation / data fetches. */
export default function Loading() {
  return (
    <div className={styles.wrap} role="status" aria-live="polite">
      <div className={styles.blob} aria-hidden />
      <div className={styles.inner}>
        <span className={styles.spinner} aria-hidden />
        <span className={styles.loadingLabel}>Loading…</span>
      </div>
    </div>
  );
}
