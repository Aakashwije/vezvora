"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { getSession } from "./session";
import type { LeadStatus, ManagedProject, SiteSettings } from "./types";
import {
  addLeadNote,
  assignLead,
  removeLead,
  removeProject,
  reorderProject,
  saveProject,
  saveSettings,
  setLeadStatus,
  toggleProjectFeatured,
} from "./server-store";
import { seedProjects } from "./seed";

async function requireAdmin() {
  const user = await getSession();
  if (!user) throw new Error("Unauthorized");
  return user;
}

function revalidateAdmin() {
  revalidatePath("/admin");
  revalidatePath("/admin/leads");
  revalidatePath("/admin/content");
  revalidatePath("/admin/settings");
}

export async function updateLeadStatusAction(id: string, status: LeadStatus) {
  await requireAdmin();
  await setLeadStatus(id, status);
  revalidateAdmin();
}

export async function assignLeadAction(id: string, assigneeId: string | null) {
  await requireAdmin();
  await assignLead(id, assigneeId);
  revalidateAdmin();
}

export async function addLeadNoteAction(id: string, body: string) {
  const user = await requireAdmin();
  const note = body.trim();
  if (!note) return;
  await addLeadNote(id, user.name, note);
  revalidateAdmin();
}

export async function removeLeadAction(id: string) {
  await requireAdmin();
  await removeLead(id);
  revalidateAdmin();
}

export async function saveProjectAction(project: ManagedProject) {
  await requireAdmin();
  if (!project.name.trim()) return;
  await saveProject(project);
  revalidateAdmin();
}

export async function removeProjectAction(id: string) {
  await requireAdmin();
  await removeProject(id);
  revalidateAdmin();
}

export async function toggleProjectFeaturedAction(id: string) {
  await requireAdmin();
  await toggleProjectFeatured(id);
  revalidateAdmin();
}

export async function reorderProjectAction(id: string, direction: -1 | 1) {
  await requireAdmin();
  await reorderProject(id, direction);
  revalidateAdmin();
}

export async function saveSettingsAction(settings: SiteSettings) {
  await requireAdmin();
  await saveSettings(settings);
  revalidateAdmin();
}

export async function blankProjectAction(): Promise<ManagedProject> {
  await requireAdmin();
  return {
    ...seedProjects[0],
    id: `pr_${randomUUID()}`,
    name: "",
    tag: "",
    desc: "",
    tech: [],
    featured: false,
    order: Date.now(),
  };
}
