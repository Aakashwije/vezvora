/**
 * Presentation metadata for quotation statuses.
 *
 * Client-safe (labels and colours only) and shaped like `lib/admin/status.ts`
 * so the console's badges look and behave the same as the leads pipeline.
 */

import type { EmailDelivery, QuotationStatus } from "./types.ts";

export const QUOTATION_STATUS_META: Record<
  QuotationStatus,
  { label: string; color: string; bg: string; description: string }
> = {
  pending_review: {
    label: "Pending review",
    color: "#1d63c9",
    bg: "rgba(29,99,201,0.12)",
    description: "Awaiting review — sends automatically at the deadline.",
  },
  updated: {
    label: "Updated",
    color: "#7a4fd1",
    bg: "rgba(122,79,209,0.12)",
    description: "Edited by an administrator; still queued to send.",
  },
  approved: {
    label: "Approved",
    color: "#0f8f88",
    bg: "rgba(47,211,196,0.16)",
    description: "Reviewed and cleared to send.",
  },
  held: {
    label: "On hold",
    color: "#b26a00",
    bg: "rgba(178,106,0,0.12)",
    description: "Auto-send paused. Nothing goes out until you resume or send.",
  },
  cancelled: {
    label: "Cancelled",
    color: "#8a938f",
    bg: "rgba(110,121,118,0.14)",
    description: "Will not be sent.",
  },
  sending: {
    label: "Sending",
    color: "#b26a00",
    bg: "rgba(178,106,0,0.14)",
    description: "Delivery in progress.",
  },
  sent: {
    label: "Sent",
    color: "#1f8f52",
    bg: "rgba(40,184,95,0.14)",
    description: "Delivered to the customer.",
  },
  failed: {
    label: "Failed",
    color: "#ba1a1a",
    bg: "rgba(186,26,26,0.12)",
    description: "The provider rejected the email. Retry when ready.",
  },
};

/** Filter order in the console's status segment. */
export const QUOTATION_PIPELINE: QuotationStatus[] = [
  "pending_review",
  "updated",
  "approved",
  "held",
  "sent",
  "failed",
  "cancelled",
];

export const EMAIL_STATE_LABEL: Record<EmailDelivery["state"], string> = {
  not_sent: "Not sent",
  sending: "Sending",
  sent: "Delivered",
  failed: "Failed",
};

/** True while the record is still counting down to an automatic send. */
export function isAwaitingAutoSend(status: QuotationStatus): boolean {
  return status === "pending_review" || status === "updated" || status === "approved";
}
