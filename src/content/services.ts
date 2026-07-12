import type { IconName } from "@/components/ui/Icon";

export type Service = {
  icon: IconName;
  title: string;
  tagline: string;
  problem: string;
  solution: string;
  deliverables: string[];
  stack: string;
  timeline: string;
};

export const services: Service[] = [
  {
    icon: "smartphone",
    title: "Mobile App Development",
    tagline: "Engage users anywhere.",
    problem:
      "Fragmented experiences and low engagement on mobile hold back growth.",
    solution:
      "Native and cross-platform apps designed for fluid performance and intuitive interactions.",
    deliverables: ["iOS & Android apps", "UI/UX design", "API integration"],
    stack: "React Native, Swift, Kotlin",
    timeline: "12–24 weeks",
  },
  {
    icon: "language",
    title: "Web Development",
    tagline: "Scalable digital ecosystems.",
    problem:
      "Outdated web presence and sluggish performance drag down conversion and brand perception.",
    solution:
      "High-performance, responsive platforms built with modern frameworks for speed and SEO.",
    deliverables: ["Web applications", "Corporate sites", "E-commerce"],
    stack: "React, Node.js, Next.js",
    timeline: "8–16 weeks",
  },
  {
    icon: "point_of_sale",
    title: "POS Systems",
    tagline: "Frictionless transactions.",
    problem:
      "Legacy point-of-sale tools slow down staff and lose data across channels.",
    solution:
      "Integrated POS with real-time inventory syncing, analytics, and a fast checkout flow.",
    deliverables: ["Terminal UI", "Inventory sync", "Payment gateway"],
    stack: "Flutter, Firebase, Stripe",
    timeline: "10–18 weeks",
  },
  {
    icon: "memory",
    title: "Custom Systems",
    tagline: "Built around your workflow.",
    problem: "Off-the-shelf software forces your team to work around its limits.",
    solution:
      "Bespoke architecture engineered precisely to your operations and scale requirements.",
    deliverables: ["Microservices", "Admin dashboards", "Integrations"],
    stack: "Go, Python, PostgreSQL",
    timeline: "16–32 weeks",
  },
];
