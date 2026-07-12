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
    name: "App Launch",
    blurb: "Get your first product to market.",
    priceLabel: "Starting from",
    price: "$18,000",
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
    price: "$25,000",
    features: [
      "Inventory management",
      "Payment gateway integration",
      "Real-time analytics",
      "Multi-location support",
      "6 months of support",
    ],
    cta: "Get started",
    variant: "featured",
    featured: true,
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
