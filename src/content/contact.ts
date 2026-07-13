import type { IconName } from "@/components/ui/Icon";
import { siteConfig } from "@/lib/site";

export type ContactChannel = { icon: IconName; label: string; value: string };

export const contactChannels: ContactChannel[] = [
  { icon: "mail", label: "Email", value: siteConfig.email },
  { icon: "call", label: "Phone", value: siteConfig.phone },
  { icon: "location_on", label: "Office", value: siteConfig.office },
];

export const projectTypes = [
  "Software engineering",
  "Data infrastructure",
  "Product design",
  "Technical consulting",
];

export const budgetRanges = [
  "LKR 50,000 – 100,000",
  "LKR 100,000 – 150,000",
  "LKR 150,000 – 200,000",
  "LKR 200,000+",
];
