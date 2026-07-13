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

export type Testimonial = {
  company: string;
  logo: string;
  name: string;
  role: string;
  quote: string;
  featured?: boolean;
  draft?: boolean;
};

export const testimonials: Testimonial[] = [
  {
    company: "ICC",
    logo: "/ICC.jpeg",
    name: "Dr. Upul Wijesekara",
    role: "GM – Buildings",
    quote:
      "Vezvora replaced our web-based procurement process with a secure mobile workflow and admin dashboard. Real-time updates, conflict-free meeting scheduling, task assignment, internal communication, and centralized site files have made our day-to-day work 90% more productive.",
  },
  {
    company: "Intimate Hygiene",
    logo: "/Intimate.png",
    name: "Inoka Gunn",
    role: "Director",
    quote:
      "Vezvora built our complete SaaS ordering platform with payment integration, analytics, dispatch, order tracking, and ML-powered forecasting. We now process 100+ orders per day, the platform has remained fully operational, and the team's service and expertise have been excellent throughout.",
    featured: true,
  },
  {
    company: "Elitewing Travels",
    logo: "/elitewing.jpg",
    name: "Thisean Bandara",
    role: "CEO",
    quote:
      "Vezvora built a tourism website that has become our primary marketing and enquiry channel. Customers quickly understand what Sri Lanka offers and regularly praise the convincing experience. The website now plays a central role in turning interest into enquiries.",
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
