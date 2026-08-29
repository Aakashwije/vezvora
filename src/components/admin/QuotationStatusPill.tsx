import { QUOTATION_STATUS_META } from "@/lib/quotation/status-meta";
import type { QuotationStatus } from "@/lib/quotation/types";
import styles from "./admin.module.css";

export function QuotationStatusPill({ status }: { status: QuotationStatus }) {
  const meta = QUOTATION_STATUS_META[status];
  return (
    <span className={styles.pill} style={{ color: meta.color, background: meta.bg }}>
      <span className={styles.pillDot} style={{ background: meta.color }} />
      {meta.label}
    </span>
  );
}
