import type { IconName } from "@/components/ui/Icon";
import { siteConfig } from "@/lib/site";
export { budgetRanges, projectTypes } from "./contact-options";

export type ContactChannel = { icon: IconName; label: string; value: string };

export const contactChannels: ContactChannel[] = [
  { icon: "mail", label: "Email", value: siteConfig.email },
  { icon: "call", label: "Phone", value: siteConfig.phone },
  { icon: "location_on", label: "Office", value: siteConfig.office },
];
