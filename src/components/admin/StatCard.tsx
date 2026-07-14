import type { ReactNode } from "react";
import { IconBadge } from "@/components/ui/IconBadge";
import type { IconName } from "@/components/ui/Icon";
import styles from "./admin.module.css";

type StatCardProps = {
  icon: IconName;
  label: string;
  value: ReactNode;
  delta?: string;
};

export function StatCard({ icon, label, value, delta }: StatCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.statTop}>
        <IconBadge name={icon} size={44} iconSize={22} radius={12} />
        {delta && <span className={styles.statDelta}>{delta}</span>}
      </div>
      <div className={styles.statValue}>{value}</div>
      <div className={styles.statLabel}>{label}</div>
    </div>
  );
}
