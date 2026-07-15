import { STATUS_META } from "@/lib/admin/status";
import type { LeadStatus } from "@/lib/admin/types";
import styles from "./admin.module.css";

export function StatusPill({ status }: { status: LeadStatus }) {
  const meta = STATUS_META[status];
  return (
    <span className={styles.pill} style={{ color: meta.color, background: meta.bg }}>
      <span className={styles.pillDot} style={{ background: meta.color }} />
      {meta.label}
    </span>
  );
}
