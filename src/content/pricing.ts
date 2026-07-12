export type PricingTier = {
  name: string;
  blurb: string;
  priceLabel: string;
  price: string;
  features: string[];
  cta: string;
  variant: "default" | "featured" | "dark";
  featured?: boolean;
};

export const pricingTiers: PricingTier[] = [
  {
    name: "Website Launch",
    blurb: "A polished website built for your business.",
    priceLabel: "Starting from",
    price: "LKR 55,000",
    features: [
      "Responsive design",
      "Up to 5 core pages",
      "SEO-ready setup",
      "Contact form integration",
      "8 weeks of support",
    ],
    cta: "Get started",
    variant: "featured",
    featured: true,
  },
  {
    name: "App Launch",
    blurb: "Get your first product to market.",
    priceLabel: "Starting from",
    price: "LKR 70,000",
    features: [
      "Single platform (iOS or Android)",
      "UI/UX design",
      "Core API integration",
      "8 weeks of support",
    ],
    cta: "Discuss needs",
    variant: "default",
  },
  {
    name: "POS Growth",
    blurb: "Modern point-of-sale systems.",
    priceLabel: "Starting from",
    price: "LKR 90,000",
    features: [
      "Inventory management",
      "Payment gateway integration",
      "Real-time analytics",
      "Multi-location support",
      "6 months of support",
    ],
    cta: "Get started",
    variant: "default",
  },
  {
    name: "Custom Enterprise",
    blurb: "Complex systems & scaling.",
    priceLabel: "Bespoke pricing",
    price: "Let's talk",
    features: [
      "Microservices architecture",
      "Advanced security & compliance",
      "Dedicated engineering team",
      "SLA-backed uptime",
    ],
    cta: "Contact sales",
    variant: "dark",
  },
];
