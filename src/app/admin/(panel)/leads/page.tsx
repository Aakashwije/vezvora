import type { Metadata } from "next";
import { listLeads } from "@/lib/admin/server-store";
import { LeadsClient } from "./LeadsClient";

export const metadata: Metadata = { title: "Leads" };

export default async function LeadsPage() {
  const leads = await listLeads();
  return <LeadsClient leads={leads} />;
}
