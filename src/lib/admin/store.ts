"use client";

import { useSyncExternalStore } from "react";
import type { Lead, LeadStatus, ManagedProject, SiteSettings } from "./types";
import { seedLeads, seedProjects, seedSettings, teamMembers } from "./seed";

/**
 * Client data layer for the admin console.
 *
 * This is a localStorage-backed prototype store with a small, explicit
 * interface (leadsRepo, projectsRepo, settingsRepo). To move to a real
 * backend, replace the internals with API calls — the components consume the
 * hooks/mutations below and don't care where the data lives.
 */

type Store<T> = {
  get: () => T;
  getServer: () => T;
  set: (next: T) => void;
  subscribe: (listener: () => void) => () => void;
  hydrate: () => void;
};

function createStore<T>(key: string, seed: T): Store<T> {
  let state = seed;
  let hydrated = false;
  const listeners = new Set<() => void>();

  const emit = () => listeners.forEach((l) => l());

  const hydrate = () => {
    if (hydrated || typeof window === "undefined") return;
    hydrated = true;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) state = JSON.parse(raw) as T;
    } catch {
      /* ignore corrupt storage */
    }
    emit();
  };

  const persist = () => {
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch {
      /* storage may be unavailable */
    }
  };

  return {
    get: () => state,
    getServer: () => seed,
    set: (next) => {
      state = next;
      persist();
      emit();
    },
    subscribe: (listener) => {
      listeners.add(listener);
      hydrate();
      return () => listeners.delete(listener);
    },
    hydrate,
  };
}

const leadsStore = createStore<Lead[]>("vz_admin_leads", seedLeads);
const projectsStore = createStore<ManagedProject[]>("vz_admin_projects", seedProjects);
const settingsStore = createStore<SiteSettings>("vz_admin_settings", seedSettings);

function useStore<T>(store: Store<T>): T {
  return useSyncExternalStore(store.subscribe, store.get, store.getServer);
}

/* ------------------------------------------------------------------ */
/* Hooks                                                               */
/* ------------------------------------------------------------------ */

export const useLeads = () => useStore(leadsStore);
export const useProjects = () => useStore(projectsStore);
export const useSettings = () => useStore(settingsStore);
export const useTeam = () => teamMembers;

export function memberById(id: string | null) {
  return teamMembers.find((m) => m.id === id) ?? null;
}

const uid = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/* ------------------------------------------------------------------ */
/* Leads repository                                                    */
/* ------------------------------------------------------------------ */

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

export const leadsRepo = {
  create(input: NewLeadInput): Lead {
    leadsStore.hydrate();
    const now = new Date().toISOString();
    const lead: Lead = {
      id: uid("ld"),
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
    leadsStore.set([lead, ...leadsStore.get()]);
    return lead;
  },

  setStatus(id: string, status: LeadStatus) {
    leadsStore.hydrate();
    leadsStore.set(
      leadsStore.get().map((l) =>
        l.id === id ? { ...l, status, updatedAt: new Date().toISOString() } : l,
      ),
    );
  },

  assign(id: string, assigneeId: string | null) {
    leadsStore.hydrate();
    leadsStore.set(
      leadsStore.get().map((l) =>
        l.id === id ? { ...l, assigneeId, updatedAt: new Date().toISOString() } : l,
      ),
    );
  },

  addNote(id: string, author: string, body: string) {
    leadsStore.hydrate();
    const now = new Date().toISOString();
    leadsStore.set(
      leadsStore.get().map((l) =>
        l.id === id
          ? {
              ...l,
              notes: [...l.notes, { id: uid("n"), author, body, createdAt: now }],
              updatedAt: now,
            }
          : l,
      ),
    );
  },

  remove(id: string) {
    leadsStore.hydrate();
    leadsStore.set(leadsStore.get().filter((l) => l.id !== id));
  },
};

/* ------------------------------------------------------------------ */
/* Projects repository                                                 */
/* ------------------------------------------------------------------ */

export const projectsRepo = {
  save(project: ManagedProject) {
    projectsStore.hydrate();
    const existing = projectsStore.get();
    const idx = existing.findIndex((p) => p.id === project.id);
    if (idx === -1) {
      projectsStore.set([...existing, { ...project, order: existing.length }]);
    } else {
      const next = [...existing];
      next[idx] = project;
      projectsStore.set(next);
    }
  },

  remove(id: string) {
    projectsStore.hydrate();
    projectsStore.set(projectsStore.get().filter((p) => p.id !== id));
  },

  toggleFeatured(id: string) {
    projectsStore.hydrate();
    projectsStore.set(
      projectsStore.get().map((p) =>
        p.id === id ? { ...p, featured: !p.featured } : p,
      ),
    );
  },

  reorder(id: string, direction: -1 | 1) {
    projectsStore.hydrate();
    const list = [...projectsStore.get()].sort((a, b) => a.order - b.order);
    const idx = list.findIndex((p) => p.id === id);
    const swap = idx + direction;
    if (idx === -1 || swap < 0 || swap >= list.length) return;
    [list[idx].order, list[swap].order] = [list[swap].order, list[idx].order];
    projectsStore.set(list);
  },

  blankProject(): ManagedProject {
    return {
      id: uid("pr"),
      name: "",
      tag: "",
      category: "Web Platforms",
      desc: "",
      tech: [],
      gradient: "linear-gradient(135deg,#8ec21a,#28b85f 60%,#2fd3c4)",
      featured: false,
      order: projectsStore.get().length,
    };
  },
};

/* ------------------------------------------------------------------ */
/* Settings repository                                                 */
/* ------------------------------------------------------------------ */

export const settingsRepo = {
  save(settings: SiteSettings) {
    settingsStore.set(settings);
  },
};
