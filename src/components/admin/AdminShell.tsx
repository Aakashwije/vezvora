import type { ReactNode } from "react";
import type { AdminUser } from "@/lib/admin/session";
import { Sidebar } from "./Sidebar";
import styles from "./admin.module.css";

/** Frame for every authenticated admin page: deep-slate sidebar + main column. */
export function AdminShell({ user, children }: { user: AdminUser; children: ReactNode }) {
  return (
    <div className={styles.shell}>
      <Sidebar user={user} />
      <div className={styles.main}>{children}</div>
    </div>
  );
}
