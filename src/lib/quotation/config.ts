/**
 * Environment configuration for the quotation system.
 *
 * Read on the server only. None of these names are `NEXT_PUBLIC_`-prefixed, so
 * they cannot be inlined into a client bundle.
 */

import { siteConfig } from "../site.ts";

export const DEFAULT_REVIEW_MINUTES = 10;

/** How long administrators get to review before the estimate auto-sends. */
export function reviewMinutes(): number {
  const raw = Number(process.env.QUOTATION_REVIEW_MINUTES);
  if (!Number.isFinite(raw) || raw <= 0) return DEFAULT_REVIEW_MINUTES;
  // Bounded so a typo cannot park quotations for a month or fire them instantly.
  return Math.min(Math.max(Math.round(raw), 1), 60 * 24);
}

export function reviewDeadlineFrom(createdAt: Date | string, minutes = reviewMinutes()): string {
  const base = typeof createdAt === "string" ? new Date(createdAt) : createdAt;
  return new Date(base.getTime() + minutes * 60_000).toISOString();
}

export function fromEmail(): string {
  return process.env.QUOTATION_FROM_EMAIL ?? `Vezvora <onboarding@resend.dev>`;
}

export function replyToEmail(): string {
  return process.env.QUOTATION_REPLY_TO ?? siteConfig.email;
}

export function adminEmail(): string | null {
  return process.env.QUOTATION_ADMIN_EMAIL ?? null;
}

/** Absolute origin used for job callbacks and links inside emails. */
export function appOrigin(): string {
  const explicit = process.env.QUOTATION_APP_URL ?? process.env.NEXT_PUBLIC_APP_URL;
  if (explicit) return explicit.replace(/\/+$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

export function qstashConfigured(): boolean {
  return Boolean(process.env.QSTASH_TOKEN);
}

export function resendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

/**
 * Shared secret for the Vercel Cron sweeper. `CRON_SECRET` is the name Vercel
 * injects into scheduled invocations automatically.
 */
export function cronSecret(): string | null {
  return process.env.QUOTATION_CRON_SECRET ?? process.env.CRON_SECRET ?? null;
}

function envInt(name: string, fallback: number): number {
  const raw = Number(process.env[name]);
  return Number.isFinite(raw) && raw > 0 ? Math.round(raw) : fallback;
}

/**
 * Public submissions allowed per IP within the window. Configurable so a
 * deployment (or an end-to-end run, which submits repeatedly from one address)
 * can widen it without touching the code.
 */
export const RATE_LIMIT = {
  max: envInt("QUOTATION_RATE_LIMIT_MAX", 5),
  windowSeconds: envInt("QUOTATION_RATE_LIMIT_WINDOW_SECONDS", 15 * 60),
} as const;
