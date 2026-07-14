import type { ReactNode } from "react";
import styles from "./admin.module.css";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  children?: ReactNode;
};

/** Sticky topbar for admin pages; `children` render as right-aligned actions. */
export function PageHeader({ title, subtitle, children }: PageHeaderProps) {
  return (
    <header className={styles.topbar}>
      <div>
        <h1 className={styles.topTitle}>{title}</h1>
        {subtitle && <div className={styles.topSub}>{subtitle}</div>}
      </div>
      {children && <div className={styles.topActions}>{children}</div>}
    </header>
  );
}
