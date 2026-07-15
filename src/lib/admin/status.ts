import type { LeadStatus } from "./types";

export const STATUS_META: Record<
  LeadStatus,
  { label: string; color: string; bg: string }
> = {
  new: { label: "New", color: "#1d63c9", bg: "rgba(29,99,201,0.12)" },
  contacted: { label: "Contacted", color: "#b26a00", bg: "rgba(178,106,0,0.12)" },
  qualified: { label: "Qualified", color: "#0f8f88", bg: "rgba(47,211,196,0.16)" },
  won: { label: "Won", color: "#1f8f52", bg: "rgba(40,184,95,0.14)" },
  lost: { label: "Lost", color: "#8a938f", bg: "rgba(110,121,118,0.14)" },
};

/** Pipeline order for the funnel and the status selector. */
export const PIPELINE: LeadStatus[] = [
  "new",
  "contacted",
  "qualified",
  "won",
  "lost",
];
