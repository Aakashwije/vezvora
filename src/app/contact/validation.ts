import { budgetRanges, projectTypes } from "../../content/contact-options.ts";

export type ContactPayload = {
  name: string;
  email: string;
  company: string;
  phone: string;
  projectType: string;
  budget: string;
  message: string;
};

export type ContactValidation =
  | { ok: true; payload: ContactPayload }
  | { ok: false; error: string };

export function cleanContactValue(value: FormDataEntryValue | null, maxLength: number): string {
  return String(value ?? "").trim().slice(0, maxLength);
}

export function isContactEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function validateContactForm(formData: FormData): ContactValidation {
  const payload: ContactPayload = {
    name: cleanContactValue(formData.get("name"), 120),
    email: cleanContactValue(formData.get("email"), 180).toLowerCase(),
    company: cleanContactValue(formData.get("company"), 160),
    phone: cleanContactValue(formData.get("phone"), 60),
    projectType: cleanContactValue(formData.get("projectType"), 100),
    budget: cleanContactValue(formData.get("budget"), 100),
    message: cleanContactValue(formData.get("message"), 2_000),
  };

  if (!payload.name || !payload.email || !payload.message) {
    return { ok: false, error: "Please fill in your name, email, and message." };
  }
  if (!isContactEmail(payload.email)) {
    return { ok: false, error: "Please enter a valid email address." };
  }
  if (!projectTypes.includes(payload.projectType as (typeof projectTypes)[number])) {
    return { ok: false, error: "Please choose a valid project type." };
  }
  if (!budgetRanges.includes(payload.budget as (typeof budgetRanges)[number])) {
    return { ok: false, error: "Please choose a valid budget range." };
  }

  return { ok: true, payload };
}
