import { Overview } from "./Overview";
import { listLeads } from "@/lib/admin/server-store";
import { buildActionCentre, buildKpis, groupActionItems, resolveRange } from "@/lib/admin/dashboard";
import { teamMembers } from "@/lib/admin/seed";
import { quotationStore } from "@/lib/quotation/store";
import { toSummary } from "@/lib/quotation/types";

type SearchParams = Record<string, string | string[] | undefined>;

/** A repeated query parameter is a malformed URL; take the first value. */
function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const [leads, quotations] = await Promise.all([listLeads(), quotationStore().list()]);

  // Aggregated on the server: the browser receives figures, not raw records to
  // recompute on every render.
  const range = resolveRange({
    range: first(params.range),
    from: first(params.from),
    to: first(params.to),
  });

  return (
    <Overview
      leads={leads}
      quotations={quotations.map(toSummary)}
      kpis={buildKpis(leads, quotations, range)}
      groups={groupActionItems(buildActionCentre(leads, quotations))}
      range={range}
      team={teamMembers}
    />
  );
}
