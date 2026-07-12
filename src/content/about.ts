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
