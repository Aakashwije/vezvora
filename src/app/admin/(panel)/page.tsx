import { Overview } from "./Overview";
import { listLeads } from "@/lib/admin/server-store";

export default async function DashboardPage() {
  const leads = await listLeads();
  return <Overview leads={leads} />;
}
