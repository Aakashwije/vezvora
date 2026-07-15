import type { Metadata } from "next";
import { getSession } from "@/lib/admin/session";
import { LeadsClient } from "./LeadsClient";

export const metadata: Metadata = { title: "Leads" };

export default async function LeadsPage() {
  const user = await getSession();
  return <LeadsClient currentUser={user?.name ?? "Admin"} />;
}
