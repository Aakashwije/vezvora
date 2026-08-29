import type { IconName } from "@/components/ui/Icon";

export type AboutStat = { value: string; label: string; tone: string };

/** `tone` maps to a highlight colour used on the dark stats band. */
export const aboutStats: AboutStat[] = [
  { value: "50+", label: "Enterprise projects", tone: "#a9e022" },
  { value: "99.9%", label: "System uptime", tone: "#3bd6c0" },
  { value: "12", label: "Global awards", tone: "#63d17f" },
  { value: "24/7", label: "Dedicated support", tone: "#8ee0a0" },
];

export type AboutValue = { icon: IconName; title: string; desc: string };

export type LeadershipMember = {
  name: string;
  title: string;
  image: string | null;
  linkedinUrl: string;
};

export const leadershipTeam: LeadershipMember[] = [
  {
    name: "Aakash Wijesekara",
    title: "Co-Founder, CEO & Chief Technology Officer",
    image: "/team/senior-management/Aakash.png",
    linkedinUrl: "https://www.linkedin.com/in/aakash-wijesekara-611588318/",
  },
  {
    name: "Thisen Bandara",
    title: "Co-Founder & Chief Product Officer (CPO)",
    image: "/team/senior-management/Thisen.jpeg",
    linkedinUrl: "https://www.linkedin.com/in/thisen-bandara-048924359/",
  },
  {
    name: "Ayora Fernando",
    title: "Head of Software Operations & Delivery",
    image: "/team/senior-management/Ayora.jpeg",
    linkedinUrl: "https://www.linkedin.com/in/ayora-fernando-73b40134b/",
  },
  {
    name: "Imesha Meegoda",
    title: "Head of Marketing",
    image: "/team/senior-management/imesha.jpeg",
    linkedinUrl: "https://www.linkedin.com/in/imesha-meegoda-180b31352/",
  },
];

export const aboutValues: AboutValue[] = [
  {
    icon: "precision_manufacturing",
    title: "Precision",
    desc: "We sweat the details others skip — architecture, edge cases, and performance budgets from day one.",
  },
  {
    icon: "rocket_launch",
    title: "Momentum",
    desc: "Tight, transparent iterations mean you see working software early and often, never a black box.",
  },
  {
    icon: "shield",
    title: "Reliability",
    desc: "We build for uptime, security, and scale so your platform holds up under real-world load.",
  },
];
