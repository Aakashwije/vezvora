import type { Metadata } from "next";
import { quotationStore } from "@/lib/quotation/store";
import { toSummary } from "@/lib/quotation/types";
import { QuotationsClient } from "./QuotationsClient";

export const metadata: Metadata = { title: "Quotations" };

export default async function QuotationsPage() {
  const records = await quotationStore().list();
  return <QuotationsClient quotations={records.map(toSummary)} />;
}
