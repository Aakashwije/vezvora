import type { ManagedProject, SiteSettings, TeamMember } from "./types";
import { projects } from "@/content/work";

export const teamMembers: TeamMember[] = [
  { id: "u_aakash", name: "Aakash", role: "admin", color: "#28b85f" },
  { id: "u_sahan", name: "Sahan", role: "editor", color: "#2fd3c4" },
  { id: "u_nimali", name: "Nimali", role: "editor", color: "#8ec21a" },
];

export const seedSettings: SiteSettings = {
  email: "vezvoraa@gmail.com",
  phone: "+94 70 156 6435",
  whatsappUrl: "https://wa.me/94701566435",
  office: "193/12, Prasanna Uyana, Mattegoda, Sri Lanka",
  metaTitle: "Vezvora — Software that moves your business forward",
  metaDescription:
    "Vezvora designs and engineers high-performance mobile apps, web platforms, POS, and custom systems.",
};

export const seedProjects: ManagedProject[] = projects.map((p, i) => ({
  id: `pr_${i + 1}`,
  name: p.name,
  tag: p.tag,
  category: p.category,
  desc: p.desc,
  tech: p.tech,
  gradient: p.gradient,
  featured: i < 2,
  order: i,
}));
