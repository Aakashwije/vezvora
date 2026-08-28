import type { ReactNode } from "react";
import type { AdminUser } from "@/lib/admin/session";
import { listLeads } from "@/lib/admin/server-store";
import { Sidebar } from "./Sidebar";
import styles from "./admin.module.css";

/** Frame for every authenticated admin page: deep-slate sidebar + main column. */
export async function AdminShell({ user, children }: { user: AdminUser; children: ReactNode }) {
  const leads = await listLeads();
  const newLeads = leads.filter((lead) => lead.status === "new").length;

  return (
    <div className={styles.shell}>
      <Sidebar user={user} newLeads={newLeads} />
      <div className={styles.main}>{children}</div>
    </div>
  );
}
