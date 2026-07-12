import type { IconName } from "@/components/ui/Icon";

export const projectFilters = [
  "All",
  "Mobile Apps",
  "Web Platforms",
  "POS",
  "Management Systems",
] as const;

export type ProjectFilter = (typeof projectFilters)[number];

export type Project = {
  name: string;
  tag: string;
  icon: IconName;
  gradient: string;
  desc: string;
  tech: string[];
  category: Exclude<ProjectFilter, "All">;
};

export const projects: Project[] = [
  {
    name: "Aura Pay Mobile",
    tag: "Fintech",
    icon: "account_balance_wallet",
    gradient: "linear-gradient(135deg,#8ec21a,#28b85f 60%,#2fd3c4)",
    desc: "A digital wallet and payment gateway built for seamless cross-border transactions with military-grade security.",
    tech: ["React Native", "Node.js"],
    category: "Mobile Apps",
  },
  {
    name: "Nexus Core ERP",
    tag: "Enterprise",
    icon: "hub",
    gradient: "linear-gradient(135deg,#23282f,#1f8f52)",
    desc: "Centralized management system streamlining operations, supply chain, and HR for a Fortune 500 manufacturer.",
    tech: ["React", "Python"],
    category: "Management Systems",
  },
  {
    name: "Lumina POS",
    tag: "Retail",
    icon: "point_of_sale",
    gradient: "linear-gradient(135deg,#2fd3c4,#28b85f 60%,#8ec21a)",
    desc: "Next-gen point-of-sale with real-time inventory syncing, analytics, and a frictionless checkout experience.",
    tech: ["Flutter", "Firebase"],
    category: "POS",
  },
  {
    name: "Vantage Analytics",
    tag: "Analytics",
    icon: "insights",
    gradient: "linear-gradient(135deg,#1f8f52,#2fd3c4)",
    desc: "Predictive modeling and big-data visualization helping B2B SaaS teams uncover hidden revenue opportunities.",
    tech: ["Vue.js", "Go"],
    category: "Web Platforms",
  },
  {
    name: "Orbit Field App",
    tag: "Logistics",
    icon: "smartphone",
    gradient: "linear-gradient(135deg,#8ec21a,#2fd3c4)",
    desc: "An offline-first mobile app coordinating thousands of field technicians with live routing and dispatch.",
    tech: ["Swift", "Kotlin"],
    category: "Mobile Apps",
  },
  {
    name: "Meridian Commerce",
    tag: "E-commerce",
    icon: "language",
    gradient: "linear-gradient(135deg,#28b85f,#1f8f52)",
    desc: "A headless commerce platform serving sub-second storefronts across 14 markets and three currencies.",
    tech: ["Next.js", "GraphQL"],
    category: "Web Platforms",
  },
  {
    name: "Cedar Retail POS",
    tag: "Hospitality",
    icon: "point_of_sale",
    gradient: "linear-gradient(135deg,#2fd3c4,#1f8f52)",
    desc: "A tablet-based POS and kitchen display system rolled out across 200+ quick-service locations.",
    tech: ["Flutter", "Stripe"],
    category: "POS",
  },
  {
    name: "Atlas Ops Suite",
    tag: "Enterprise",
    icon: "memory",
    gradient: "linear-gradient(135deg,#1c2a24,#28b85f)",
    desc: "A modular operations platform unifying scheduling, assets, and reporting for a national utility.",
    tech: ["Go", "PostgreSQL"],
    category: "Management Systems",
  },
];
