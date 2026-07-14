/** Domain types for the admin console. */

export const LEAD_STATUSES = [
  "new",
  "contacted",
  "qualified",
  "won",
  "lost",
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export type LeadNote = {
  id: string;
  author: string;
  body: string;
  createdAt: string; // ISO
};

export type Lead = {
  id: string;
  name: string;
  email: string;
  company?: string;
  phone?: string;
  projectType: string;
  budget: string;
  message: string;
  status: LeadStatus;
  /** TeamMember id, or null when unassigned. */
  assigneeId: string | null;
  notes: LeadNote[];
  /** Where the lead came from, e.g. "Contact page". */
  source: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
};

export type TeamMember = {
  id: string;
  name: string;
  role: "admin" | "editor";
  color: string;
};

/** Editable settings mirroring the public siteConfig. */
export type SiteSettings = {
  email: string;
  phone: string;
  whatsappUrl: string;
  office: string;
  metaTitle: string;
  metaDescription: string;
};

/** A managed portfolio project (mirrors the public content Project). */
export type ManagedProject = {
  id: string;
  name: string;
  tag: string;
  category: string;
  desc: string;
  tech: string[];
  gradient: string;
  featured: boolean;
  order: number;
};
