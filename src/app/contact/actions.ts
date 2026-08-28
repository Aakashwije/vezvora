"use server";

import { headers } from "next/headers";
import { createLead } from "@/lib/admin/server-store";
import { cleanContactValue, validateContactForm } from "./validation";

export type ContactFormState = {
  ok?: boolean;
  error?: string;
};

const submissions = new Map<string, number[]>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_SUBMISSIONS = 3;

async function clientKey(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "local"
  );
}

async function isRateLimited(): Promise<boolean> {
  const key = await clientKey();
  const now = Date.now();
  const recent = (submissions.get(key) ?? []).filter((time) => now - time < WINDOW_MS);
  if (recent.length >= MAX_SUBMISSIONS) {
    submissions.set(key, recent);
    return true;
  }
  submissions.set(key, [...recent, now]);
  return false;
}

async function notifyLead(payload: Record<string, string>) {
  const webhook = process.env.CONTACT_WEBHOOK_URL;
  if (!webhook) return;

  try {
    await fetch(webhook, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    // Lead capture should still succeed if notification delivery fails.
  }
}

export async function submitContact(
  _prev: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const trap = cleanContactValue(formData.get("website"), 120);
  if (trap) return { ok: true };

  if (await isRateLimited()) {
    return { error: "Too many submissions. Please try again in a few minutes." };
  }

  const validation = validateContactForm(formData);
  if (!validation.ok) return { error: validation.error };
  const { name, email, company, phone, projectType, budget, message } = validation.payload;

  const lead = await createLead({
    name,
    email,
    company,
    phone,
    projectType,
    budget,
    message,
    source: "Contact page",
  });

  await notifyLead({
    id: lead.id,
    name,
    email,
    company,
    phone,
    projectType,
    budget,
    message,
  });

  return { ok: true };
}
