import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import type { Lead, LeadStatus, ManagedProject, SiteSettings } from "./types";
import { seedProjects, seedSettings } from "./seed";

type AdminData = {
  leads: Lead[];
  projects: ManagedProject[];
  settings: SiteSettings;
};

export type NewLeadInput = {
  name: string;
  email: string;
  company?: string;
  phone?: string;
  projectType: string;
  budget: string;
  message: string;
  source?: string;
};

const DATA_DIR = process.env.ADMIN_DATA_DIR ?? path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "admin-store.json");

const emptyData = (): AdminData => ({
  leads: [],
  projects: seedProjects,
  settings: seedSettings,
});

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function isLeadArray(value: unknown): value is Lead[] {
  return Array.isArray(value) && value.every((lead) => {
    if (!isObject(lead)) return false;
    return (
      typeof lead.id === "string" &&
      typeof lead.name === "string" &&
      typeof lead.email === "string" &&
      typeof lead.status === "string" &&
      Array.isArray(lead.notes)
    );
  });
}

function isProjectArray(value: unknown): value is ManagedProject[] {
  return Array.isArray(value) && value.every((project) => {
    if (!isObject(project)) return false;
    return (
      typeof project.id === "string" &&
      typeof project.name === "string" &&
      typeof project.order === "number"
    );
  });
}

function isSettings(value: unknown): value is SiteSettings {
  if (!isObject(value)) return false;
  return (
    typeof value.email === "string" &&
    typeof value.phone === "string" &&
    typeof value.whatsappUrl === "string" &&
    typeof value.office === "string" &&
    typeof value.metaTitle === "string" &&
    typeof value.metaDescription === "string"
  );
}

function normalizeData(value: unknown): AdminData {
  if (!isObject(value)) return emptyData();
  const fallback = emptyData();
  return {
    leads: isLeadArray(value.leads) ? value.leads : fallback.leads,
    projects: isProjectArray(value.projects) ? value.projects : fallback.projects,
    settings: isSettings(value.settings) ? value.settings : fallback.settings,
  };
}

async function readData(): Promise<AdminData> {
  try {
    const raw = await readFile(DATA_FILE, "utf8");
    return normalizeData(JSON.parse(raw));
  } catch {
    return emptyData();
  }
}

async function writeData(data: AdminData): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(DATA_FILE, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

async function updateData<T>(mutate: (data: AdminData) => T): Promise<T> {
  const data = await readData();
  const result = mutate(data);
  await writeData(data);
  return result;
}

export async function listLeads(): Promise<Lead[]> {
  const data = await readData();
  return data.leads;
}

export async function createLead(input: NewLeadInput): Promise<Lead> {
  return updateData((data) => {
    const now = new Date().toISOString();
    const lead: Lead = {
      id: `ld_${randomUUID()}`,
      name: input.name,
      email: input.email,
      company: input.company || undefined,
      phone: input.phone || undefined,
      projectType: input.projectType,
      budget: input.budget,
      message: input.message,
      status: "new",
      assigneeId: null,
      notes: [],
      source: input.source ?? "Contact page",
      createdAt: now,
      updatedAt: now,
    };
    data.leads.unshift(lead);
    return lead;
  });
}

export async function setLeadStatus(id: string, status: LeadStatus): Promise<void> {
  await updateData((data) => {
    data.leads = data.leads.map((lead) =>
      lead.id === id ? { ...lead, status, updatedAt: new Date().toISOString() } : lead,
    );
  });
}

export async function assignLead(id: string, assigneeId: string | null): Promise<void> {
  await updateData((data) => {
    data.leads = data.leads.map((lead) =>
      lead.id === id ? { ...lead, assigneeId, updatedAt: new Date().toISOString() } : lead,
    );
  });
}

export async function addLeadNote(id: string, author: string, body: string): Promise<void> {
  await updateData((data) => {
    const now = new Date().toISOString();
    data.leads = data.leads.map((lead) =>
      lead.id === id
        ? {
            ...lead,
            notes: [...lead.notes, { id: `n_${randomUUID()}`, author, body, createdAt: now }],
            updatedAt: now,
          }
        : lead,
    );
  });
}

export async function removeLead(id: string): Promise<void> {
  await updateData((data) => {
    data.leads = data.leads.filter((lead) => lead.id !== id);
  });
}

export async function listProjects(): Promise<ManagedProject[]> {
  const data = await readData();
  return data.projects;
}

export async function saveProject(project: ManagedProject): Promise<void> {
  await updateData((data) => {
    const idx = data.projects.findIndex((item) => item.id === project.id);
    if (idx === -1) {
      data.projects.push({ ...project, order: data.projects.length });
    } else {
      data.projects[idx] = project;
    }
  });
}

export async function removeProject(id: string): Promise<void> {
  await updateData((data) => {
    data.projects = data.projects.filter((project) => project.id !== id);
  });
}

export async function toggleProjectFeatured(id: string): Promise<void> {
  await updateData((data) => {
    data.projects = data.projects.map((project) =>
      project.id === id ? { ...project, featured: !project.featured } : project,
    );
  });
}

export async function reorderProject(id: string, direction: -1 | 1): Promise<void> {
  await updateData((data) => {
    const list = [...data.projects].sort((a, b) => a.order - b.order);
    const idx = list.findIndex((project) => project.id === id);
    const swap = idx + direction;
    if (idx === -1 || swap < 0 || swap >= list.length) return;
    const orderA = list[idx].order;
    const orderB = list[swap].order;
    list[idx] = { ...list[idx], order: orderB };
    list[swap] = { ...list[swap], order: orderA };
    data.projects = list;
  });
}

export async function getSettings(): Promise<SiteSettings> {
  const data = await readData();
  return data.settings;
}

export async function saveSettings(settings: SiteSettings): Promise<void> {
  await updateData((data) => {
    data.settings = settings;
  });
}
