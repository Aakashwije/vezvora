import type { Lead, ManagedProject, SiteSettings, TeamMember } from "./types";
import { projects } from "@/content/work";

export const teamMembers: TeamMember[] = [
  { id: "u_aakash", name: "Aakash", role: "admin", color: "#28b85f" },
  { id: "u_sahan", name: "Sahan", role: "editor", color: "#2fd3c4" },
  { id: "u_nimali", name: "Nimali", role: "editor", color: "#8ec21a" },
];

/** Deterministic ISO string N days/hours before a fixed reference date. */
function daysAgo(days: number, hours = 0): string {
  const ref = new Date("2026-07-14T09:00:00.000Z").getTime();
  return new Date(ref - (days * 24 + hours) * 3600_000).toISOString();
}

export const seedLeads: Lead[] = [
  {
    id: "ld_1024",
    name: "Dinesh Fernando",
    email: "dinesh@lankaretail.lk",
    company: "Lanka Retail Group",
    phone: "+94 77 123 4567",
    projectType: "Software engineering",
    budget: "LKR 200,000+",
    message:
      "We run 40 retail outlets and need a unified POS with real-time inventory. Current system is offline-only and slow.",
    status: "qualified",
    assigneeId: "u_aakash",
    notes: [
      {
        id: "n_1",
        author: "Aakash",
        body: "Great fit for POS Growth. Sent proposal, awaiting sign-off on discovery sprint.",
        createdAt: daysAgo(1, 3),
      },
    ],
    source: "Contact page",
    createdAt: daysAgo(2),
    updatedAt: daysAgo(1, 3),
  },
  {
    id: "ld_1025",
    name: "Priya Jayawardena",
    email: "priya@meridianhealth.lk",
    company: "Meridian Health",
    projectType: "Product design",
    budget: "LKR 150,000 – 200,000",
    message:
      "Looking for a patient-booking mobile app with online payments. Have wireframes ready to share.",
    status: "contacted",
    assigneeId: "u_sahan",
    notes: [],
    source: "Contact page",
    createdAt: daysAgo(3, 5),
    updatedAt: daysAgo(2),
  },
  {
    id: "ld_1026",
    name: "Ruwan Silva",
    email: "ruwan@silvalogistics.lk",
    company: "Silva Logistics",
    projectType: "Technical consulting",
    budget: "LKR 100,000 – 150,000",
    message: "Need help scaling our fleet-tracking platform — latency issues under load.",
    status: "new",
    assigneeId: null,
    notes: [],
    source: "Contact page",
    createdAt: daysAgo(0, 4),
    updatedAt: daysAgo(0, 4),
  },
  {
    id: "ld_1027",
    name: "Ayesha Perera",
    email: "ayesha@bloomcafe.lk",
    company: "Bloom Café",
    projectType: "Software engineering",
    budget: "LKR 50,000 – 100,000",
    message: "Small café chain — want a simple ordering app + loyalty program.",
    status: "won",
    assigneeId: "u_aakash",
    notes: [
      {
        id: "n_2",
        author: "Aakash",
        body: "Signed! Kickoff scheduled. Moving to delivery.",
        createdAt: daysAgo(5),
      },
    ],
    source: "Contact page",
    createdAt: daysAgo(9),
    updatedAt: daysAgo(5),
  },
  {
    id: "ld_1028",
    name: "Kasun Bandara",
    email: "kasun@edgemedia.lk",
    company: "Edge Media",
    projectType: "Data infrastructure",
    budget: "LKR 100,000 – 150,000",
    message: "Considering a data warehouse migration. Comparing a few vendors.",
    status: "lost",
    assigneeId: "u_nimali",
    notes: [
      {
        id: "n_3",
        author: "Nimali",
        body: "Went with an in-house team. Keep warm for future work.",
        createdAt: daysAgo(11),
      },
    ],
    source: "Contact page",
    createdAt: daysAgo(15),
    updatedAt: daysAgo(11),
  },
  {
    id: "ld_1029",
    name: "Tharindu Wickramasinghe",
    email: "tharindu@novapay.lk",
    company: "NovaPay",
    projectType: "Software engineering",
    budget: "LKR 200,000+",
    message: "Fintech wallet — need PCI-conscious architecture and a mobile app.",
    status: "new",
    assigneeId: null,
    notes: [],
    source: "Contact page",
    createdAt: daysAgo(0, 9),
    updatedAt: daysAgo(0, 9),
  },
];

export const seedSettings: SiteSettings = {
  email: "vezvoraa@gmail.com",
  phone: "+94 71 357 9967",
  whatsappUrl: "https://wa.me/94713579967",
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
