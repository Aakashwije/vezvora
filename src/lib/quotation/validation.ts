/**
 * Server-side schema validation and normalization for estimate submissions.
 *
 * Pure and dependency-free so it can be unit-tested directly. Everything the
 * public form sends passes through here; anything not described by this schema
 * is discarded rather than trusted.
 */

import {
  BUDGET_BANDS,
  DESIGN_SCOPES,
  FEATURES,
  INTEGRATIONS,
  MAINTENANCE_PLANS,
  PLATFORMS,
  SERVICE_CATEGORIES,
  TIMELINES,
  USER_VOLUMES,
  type BudgetBand,
  type DesignScope,
  type FeatureKey,
  type IntegrationKey,
  type MaintenancePlan,
  type Platform,
  type ServiceCategory,
  type Timeline,
  type UserVolume,
} from "../../content/quotation-options.ts";
import type { QuotationRequirements } from "./types.ts";

export const MAX_LENGTHS = {
  contactName: 120,
  companyName: 160,
  email: 180,
  phone: 40,
  projectName: 140,
  description: 4_000,
  notes: 2_000,
} as const;

export const MIN_DESCRIPTION_LENGTH = 30;
/** Caps multi-select input so a crafted payload cannot inflate a document. */
export const MAX_SELECTIONS = 32;

export type FieldErrors = Partial<Record<keyof QuotationRequirements, string>>;

export type QuotationValidation =
  | { ok: true; payload: QuotationRequirements }
  | { ok: false; errors: FieldErrors; error: string };

/** Control characters, keeping newline and tab which are meaningful in prose. */
const CONTROL_CHARS = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g;

/**
 * Collapse whitespace, drop control characters, and clamp length. Angle
 * brackets are stripped so stored text can never smuggle markup into an email
 * or PDF even if an escape were missed downstream.
 */
export function cleanText(value: unknown, maxLength: number): string {
  return String(value ?? "")
    .replace(/\r\n?/g, "\n")
    .replace(CONTROL_CHARS, "")
    .replace(/[<>]/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, maxLength);
}

export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value) && value.length <= MAX_LENGTHS.email;
}

/** Accepts international formats; requires enough digits to be dialable. */
export function isPhone(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15 && /^[+\d][\d\s()+.-]*$/.test(value);
}

function pickOne<T extends string>(allowed: readonly T[], value: unknown): T | null {
  const candidate = String(value ?? "").trim();
  return (allowed as readonly string[]).includes(candidate) ? (candidate as T) : null;
}

/** Keep only known values, de-duplicated, in catalogue order. */
function pickMany<T extends string>(allowed: readonly T[], values: unknown[]): T[] {
  const wanted = new Set(values.slice(0, MAX_SELECTIONS).map((value) => String(value ?? "").trim()));
  return allowed.filter((option) => wanted.has(option));
}

export type RawSubmission = {
  contactName?: unknown;
  companyName?: unknown;
  email?: unknown;
  phone?: unknown;
  projectName?: unknown;
  service?: unknown;
  description?: unknown;
  platforms?: unknown[];
  features?: unknown[];
  integrations?: unknown[];
  design?: unknown;
  userVolume?: unknown;
  timeline?: unknown;
  maintenance?: unknown;
  budget?: unknown;
  notes?: unknown;
  consent?: unknown;
};

/** Read a `FormData` payload into the shape `validateQuotation` expects. */
export function submissionFromFormData(formData: FormData): RawSubmission {
  return {
    contactName: formData.get("contactName"),
    companyName: formData.get("companyName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    projectName: formData.get("projectName"),
    service: formData.get("service"),
    description: formData.get("description"),
    platforms: formData.getAll("platforms"),
    features: formData.getAll("features"),
    integrations: formData.getAll("integrations"),
    design: formData.get("design"),
    userVolume: formData.get("userVolume"),
    timeline: formData.get("timeline"),
    maintenance: formData.get("maintenance"),
    budget: formData.get("budget"),
    notes: formData.get("notes"),
    consent: formData.get("consent"),
  };
}

function isChecked(value: unknown): boolean {
  const normalized = String(value ?? "").trim().toLowerCase();
  return normalized === "on" || normalized === "true" || normalized === "yes" || normalized === "1";
}

export function validateQuotation(raw: RawSubmission): QuotationValidation {
  const errors: FieldErrors = {};

  const contactName = cleanText(raw.contactName, MAX_LENGTHS.contactName);
  const companyName = cleanText(raw.companyName, MAX_LENGTHS.companyName);
  const email = cleanText(raw.email, MAX_LENGTHS.email).toLowerCase();
  const phone = cleanText(raw.phone, MAX_LENGTHS.phone);
  const projectName = cleanText(raw.projectName, MAX_LENGTHS.projectName);
  const description = cleanText(raw.description, MAX_LENGTHS.description);
  const notes = cleanText(raw.notes, MAX_LENGTHS.notes);

  if (contactName.length < 2) errors.contactName = "Please enter your name.";
  if (!isEmail(email)) errors.email = "Please enter a valid email address.";
  if (!isPhone(phone)) errors.phone = "Please enter a valid phone or WhatsApp number.";
  if (projectName.length < 2) errors.projectName = "Please name your project or product.";
  if (description.length < MIN_DESCRIPTION_LENGTH) {
    errors.description = `Please describe your project in at least ${MIN_DESCRIPTION_LENGTH} characters.`;
  }

  const service = pickOne<ServiceCategory>(SERVICE_CATEGORIES, raw.service);
  if (!service) errors.service = "Please choose a service category.";

  const design = pickOne<DesignScope>(DESIGN_SCOPES, raw.design);
  if (!design) errors.design = "Please choose your design requirements.";

  const userVolume = pickOne<UserVolume>(USER_VOLUMES, raw.userVolume);
  if (!userVolume) errors.userVolume = "Please choose an expected user volume.";

  const timeline = pickOne<Timeline>(TIMELINES, raw.timeline);
  if (!timeline) errors.timeline = "Please choose a preferred timeline.";

  const maintenance = pickOne<MaintenancePlan>(MAINTENANCE_PLANS, raw.maintenance);
  if (!maintenance) errors.maintenance = "Please choose your support requirements.";

  const budget = pickOne<BudgetBand>(BUDGET_BANDS, raw.budget) ?? "undisclosed";

  const platforms = pickMany<Platform>(PLATFORMS, raw.platforms ?? []);
  if (platforms.length === 0) errors.platforms = "Select at least one platform.";

  const features = pickMany<FeatureKey>(FEATURES, raw.features ?? []);
  if (features.length === 0) errors.features = "Select at least one key feature.";

  const integrations = pickMany<IntegrationKey>(INTEGRATIONS, raw.integrations ?? []);

  if (!isChecked(raw.consent)) {
    errors.consent = "Please confirm you agree to be contacted about this estimate.";
  }

  const firstError = Object.values(errors)[0];
  if (firstError || !service || !design || !userVolume || !timeline || !maintenance) {
    return { ok: false, errors, error: firstError ?? "Please review the highlighted fields." };
  }

  return {
    ok: true,
    payload: {
      contactName,
      companyName,
      email,
      phone,
      projectName,
      service,
      description,
      platforms,
      features,
      integrations,
      design,
      userVolume,
      timeline,
      maintenance,
      budget,
      notes,
      consent: true,
    },
  };
}
