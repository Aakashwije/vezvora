import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { quotationStore } from "@/lib/quotation/store";
import { QuotationDetail } from "./QuotationDetail";

export const metadata: Metadata = { title: "Quotation" };

export default async function QuotationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const record = await quotationStore().get(id);
  if (!record) notFound();

  return <QuotationDetail record={record} />;
}
