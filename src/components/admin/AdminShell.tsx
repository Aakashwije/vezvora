import type { ReactNode } from "react";
import type { AdminUser } from "@/lib/admin/session";
import { listLeads } from "@/lib/admin/server-store";
import { quotationStore } from "@/lib/quotation/store";
import { isAwaitingAutoSend, needsApproval } from "@/lib/quotation/status-meta";
import { mayAutoSend } from "@/lib/quotation/types";
import { Sidebar } from "./Sidebar";
import styles from "./admin.module.css";

/** Frame for every authenticated admin page: deep-slate sidebar + main column. */
export async function AdminShell({ user, children }: { user: AdminUser; children: ReactNode }) {
  const [leads, quotations] = await Promise.all([listLeads(), quotationStore().list()]);
  const newLeads = leads.filter((lead) => lead.status === "new").length;
  // Anything still in the review pipeline: counting down to an automatic send,
  // or withheld by the confidence rules and waiting on a human.
  const pendingQuotations = quotations.filter((quotation) => {
    const autoSend = mayAutoSend(quotation);
    return (
      isAwaitingAutoSend(quotation.status, autoSend) || needsApproval(quotation.status, autoSend)
    );
  }).length;

  return (
    <div className={styles.shell}>
      <Sidebar user={user} newLeads={newLeads} pendingQuotations={pendingQuotations} />
      <div className={styles.main}>{children}</div>
    </div>
  );
}
