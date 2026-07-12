import type { IconName } from "@/components/ui/Icon";

export type HeroStat = { value: string; suffix?: string; label: string };

export const heroStats: HeroStat[] = [
  { value: "140+", label: "Products shipped" },
  { value: "98%", label: "Client retention" },
  { value: "4.9", suffix: "/5", label: "Avg. rating" },
];

export const trustLogos = [
  { name: "ICC", src: "/ICC.jpeg" },
  { name: "Intimate Hygiene", src: "/Intimate.png" },
  { name: "UD Travels", src: "/ud.png" },
  { name: "Elitewing Travels", src: "/elitewing.jpg" },
];

export type HomeService = { icon: IconName; title: string; desc: string };

export const homeServices: HomeService[] = [
  {
    icon: "smartphone",
    title: "Mobile Apps",
    desc: "Native and cross-platform experiences that users love to open every day.",
  },
  {
    icon: "language",
    title: "Web Platforms",
    desc: "Scalable, secure web applications engineered for complex business needs.",
  },
  {
    icon: "point_of_sale",
    title: "POS Systems",
    desc: "Integrated point-of-sale solutions for retail and hospitality at scale.",
  },
  {
    icon: "memory",
    title: "Custom Systems",
    desc: "Bespoke architecture tailored precisely to your unique workflow.",
  },
];

export type ProcessStep = { num: string; title: string; desc: string };

export const processSteps: ProcessStep[] = [
  {
    num: "01",
    title: "Discover",
    desc: "We map goals, users, and constraints into a sharp, actionable brief.",
  },
  {
    num: "02",
    title: "Design",
    desc: "Prototypes and systems that turn ambiguity into a clear product direction.",
  },
  {
    num: "03",
    title: "Engineer",
    desc: "Production-grade builds shipped in tight, transparent iterations.",
  },
  {
    num: "04",
    title: "Scale",
    desc: "We monitor, optimize, and grow the platform alongside your business.",
  },
];
