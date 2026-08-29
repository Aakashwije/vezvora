import type { IconName } from "@/components/ui/Icon";

export type AboutStat = { value: string; label: string; tone: string };

/** `tone` maps to a highlight colour used on the dark stats band. */
export const aboutStats: AboutStat[] = [
  { value: "10+", label: "Enterprise projects", tone: "#a9e022" },
  { value: "99.9%", label: "System uptime", tone: "#3bd6c0" },
  { value: "4", label: "Core services", tone: "#63d17f" },
  { value: "24/7", label: "Dedicated support", tone: "#8ee0a0" },
];

export type AboutValue = { icon: IconName; title: string; desc: string };

export type LeadershipMember = {
  name: string;
  title: string;
  image: string | null;
  linkedinUrl: string;
  company: string;
  companyLogo: string;
};

export const leadershipTeam: LeadershipMember[] = [
  {
    name: "Aakash Wijesekara",
    title: "Co-Founder, CEO & Chief Technology Officer",
    image: "/management-team/senior-management/Aakash.png",
    linkedinUrl: "https://www.linkedin.com/in/aakash-wijesekara-611588318/",
    company: "WSO2",
    companyLogo: "/company-logos/wso2.webp",
  },
  {
    name: "Thisen Bandara",
    title: "Co-Founder & Chief Product Officer (CPO)",
    image: "/management-team/senior-management/Thisen.jpeg",
    linkedinUrl: "https://www.linkedin.com/in/thisen-bandara-048924359/",
    company: "APS Lanka",
    companyLogo: "/company-logos/aps-lanka.png",
  },
  {
    name: "Ayora Fernando",
    title: "Head of Software Operations & Delivery",
    image: "/management-team/senior-management/Ayora.jpeg",
    linkedinUrl: "https://www.linkedin.com/in/ayora-fernando-73b40134b/",
    company: "PickMe",
    companyLogo: "/company-logos/pickme.svg",
  },
  {
    name: "Imesha Meegoda",
    title: "Head of Marketing",
    image: "/management-team/senior-management/imesha.jpeg",
    linkedinUrl: "https://www.linkedin.com/in/imesha-meegoda-180b31352/",
    company: "Epic Lanka",
    companyLogo: "/company-logos/epic-lanka.png",
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
