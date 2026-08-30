import type { Metadata } from "next";
import { quotationStore } from "@/lib/quotation/store";
import { PricingRulesClient } from "./PricingRulesClient";

export const metadata: Metadata = { title: "Pricing rules" };

export default async function PricingRulesPage() {
  const config = await quotationStore().getPricingConfig();
  return <PricingRulesClient config={JSON.stringify(config, null, 2)} version={config.version} />;
}
