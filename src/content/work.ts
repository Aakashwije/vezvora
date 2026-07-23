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
  caseStudyHref?: string;
  logo?: {
    src: string;
    alt: string;
  };
};

export const projects: Project[] = [
  {
    name: "Intimate Hygiene",
    tag: "E-commerce",
    icon: "shield",
    gradient: "linear-gradient(135deg,#2fd3c4,#28b85f 55%,#8ec21a)",
    desc: "A full-stack commerce platform for disposable hygiene products, combining cash-on-delivery and WhatsApp checkout with a tri-lingual storefront and real-time operations console.",
    tech: ["React 19", "Vite 8", "Supabase", "Tailwind CSS 4"],
    category: "Web Platforms",
    caseStudyHref: "/work/intimate-hygiene",
    logo: {
      src: "/Intimate.png",
      alt: "Intimate Hygiene Enterprises logo",
    },
  },
  {
    name: "ProcuraX",
    tag: "Construction management",
    icon: "architecture",
    gradient: "linear-gradient(135deg,#082b64,#1765b6 58%,#6bb8ec)",
    desc: "An intelligent procurement and construction management system that brings project visibility, scheduling, team communication, and field operations into one mobile platform.",
    tech: ["Flutter", "Node.js 22", "Express 5", "MongoDB Atlas", "Firebase"],
    category: "Management Systems",
    caseStudyHref: "/work/procurax",
    logo: {
      src: "/ICC.jpeg",
      alt: "International Construction Consortium logo",
    },
  },
  {
    name: "EliteWing Travels",
    tag: "Luxury travel",
    icon: "language",
    gradient: "linear-gradient(135deg,#061a3d,#0a4d9d 58%,#c69d3b)",
    desc: "A premium Sri Lankan travel platform that brings tailored tours, destination discovery, fleet exploration, and trip enquiries into one polished digital experience.",
    tech: ["Next.js", "TypeScript", "Tailwind CSS", "Framer Motion"],
    category: "Web Platforms",
    caseStudyHref: "/work/elitewing-travels",
    logo: {
      src: "/elitewing.jpg",
      alt: "EliteWing Travels logo",
    },
  },
  {
    name: "UD Travels",
    tag: "Transport & tourism",
    icon: "language",
    gradient: "linear-gradient(135deg,#0c1f30,#1a3d5c 58%,#dc2626)",
    desc: "A modern transport and tourism platform that makes it simple to explore services, browse a diverse fleet, and request reliable travel solutions across Sri Lanka.",
    tech: ["Next.js", "React", "CSS Modules", "Server Actions"],
    category: "Web Platforms",
    caseStudyHref: "/work/ud-travels",
    logo: {
      src: "/ud.png",
      alt: "UD Travels logo",
    },
  },
  {
    name: "Matheesha Wijesekara Portfolio",
    tag: "Athlete portfolio",
    icon: "star",
    gradient: "linear-gradient(135deg,#05060b,#18213c 58%,#d6ae42)",
    desc: "A cinematic athlete portfolio for Sri Lanka's top U19 squash player, bringing achievements, media, galleries, sponsorships, and content management into one experience.",
    tech: [
      "Next.js 16",
      "TypeScript",
      "Tailwind CSS 4",
      "Supabase",
      "Framer Motion",
    ],
    category: "Web Platforms",
    caseStudyHref: "/work/matheesha-wijesekara",
    logo: {
      src: "/matheesha_logo.png",
      alt: "Matheesha Wijesekara logo",
    },
  },
  {
    name: "Sri Lanka Squash Player Management System",
    tag: "Athlete management",
    icon: "insights",
    gradient: "linear-gradient(135deg,#07182c,#1261a8 56%,#e2b424)",
    desc: "A role-based training and performance platform for Sri Lanka Squash-affiliated players and coaches, unifying workload, injury prevention, scheduling, and player development.",
    tech: ["React", "Vite", "Firebase", "Gemini AI", "Recharts"],
    category: "Management Systems",
    caseStudyHref: "/work/sri-lanka-squash-player-management",
    logo: {
      src: "/SL_SQUASH.jpeg",
      alt: "Sri Lanka Squash logo",
    },
  },
  {
    name: "Techni",
    tag: "Field-service marketplace",
    icon: "smartphone",
    gradient: "linear-gradient(135deg,#0a2158,#2563eb 58%,#5ba8ff)",
    desc: "A mobile worker platform that helps service professionals complete secure onboarding, manage job requests, navigate to customers, and monitor earnings in one place.",
    tech: ["Flutter", "Firebase", "Node.js", "Express", "Google Maps"],
    category: "Mobile Apps",
    caseStudyHref: "/work/techni",
    logo: {
      src: "/techni.png",
      alt: "Techni logo",
    },
  },
];
