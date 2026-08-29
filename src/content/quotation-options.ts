/**
 * Client-safe catalogue for the Instant Estimate form.
 *
 * These are labels and keys only — every price lives server-side in
 * `src/lib/quotation/pricing-config.ts`. The public bundle must never be able
 * to see or influence what a line item costs.
 */

export const SERVICE_CATEGORIES = [
  "website",
  "mobile_app",
  "pos_system",
  "saas_platform",
  "custom_system",
  "ui_ux",
  "other",
] as const;
export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];

export const PLATFORMS = [
  "web",
  "ios",
  "android",
  "desktop",
  "pos_terminal",
  "tablet",
  "api",
] as const;
export type Platform = (typeof PLATFORMS)[number];

export const FEATURES = [
  "auth",
  "roles",
  "payments",
  "admin_dashboard",
  "realtime",
  "notifications",
  "search",
  "reporting",
  "multi_language",
  "multi_tenant",
  "offline",
  "inventory",
  "booking",
  "documents",
  "maps",
  "ai",
] as const;
export type FeatureKey = (typeof FEATURES)[number];

export const INTEGRATIONS = [
  "payment_gateway",
  "sms",
  "whatsapp",
  "email_marketing",
  "accounting",
  "erp_crm",
  "logistics",
  "social_login",
  "analytics",
  "custom_api",
] as const;
export type IntegrationKey = (typeof INTEGRATIONS)[number];

export const DESIGN_SCOPES = ["template", "standard", "premium", "brand"] as const;
export type DesignScope = (typeof DESIGN_SCOPES)[number];

export const USER_VOLUMES = ["small", "medium", "large", "xlarge"] as const;
export type UserVolume = (typeof USER_VOLUMES)[number];

export const TIMELINES = ["flexible", "standard", "fast", "urgent"] as const;
export type Timeline = (typeof TIMELINES)[number];

export const MAINTENANCE_PLANS = ["none", "basic", "standard", "premium"] as const;
export type MaintenancePlan = (typeof MAINTENANCE_PLANS)[number];

export const BUDGET_BANDS = [
  "undisclosed",
  "under_500k",
  "500k_1m",
  "1m_2_5m",
  "2_5m_5m",
  "over_5m",
] as const;
export type BudgetBand = (typeof BUDGET_BANDS)[number];

type Option<T extends string> = { value: T; label: string; hint?: string };

export const serviceOptions: Option<ServiceCategory>[] = [
  { value: "website", label: "Website", hint: "Marketing site, portal, or content platform" },
  { value: "mobile_app", label: "Mobile app", hint: "iOS and/or Android product" },
  { value: "pos_system", label: "POS system", hint: "Point of sale, billing, and stock" },
  { value: "saas_platform", label: "SaaS platform", hint: "Multi-tenant subscription product" },
  { value: "custom_system", label: "Custom system", hint: "Internal tooling or bespoke workflow" },
  { value: "ui_ux", label: "UI/UX design", hint: "Product design without engineering" },
  { value: "other", label: "Other", hint: "Tell us more in the description" },
];

export const platformOptions: Option<Platform>[] = [
  { value: "web", label: "Web browser" },
  { value: "ios", label: "iOS" },
  { value: "android", label: "Android" },
  { value: "desktop", label: "Desktop (Windows/macOS)" },
  { value: "pos_terminal", label: "POS terminal" },
  { value: "tablet", label: "Tablet" },
  { value: "api", label: "API / integrations only" },
];

export const featureOptions: Option<FeatureKey>[] = [
  { value: "auth", label: "Accounts & authentication" },
  { value: "roles", label: "Roles & permissions" },
  { value: "payments", label: "Online payments & checkout" },
  { value: "admin_dashboard", label: "Admin dashboard" },
  { value: "realtime", label: "Real-time updates or chat" },
  { value: "notifications", label: "Push / SMS / email notifications" },
  { value: "search", label: "Advanced search & filtering" },
  { value: "reporting", label: "Reporting & analytics" },
  { value: "multi_language", label: "Multi-language support" },
  { value: "multi_tenant", label: "Multi-tenant / multi-branch" },
  { value: "offline", label: "Offline mode & sync" },
  { value: "inventory", label: "Inventory management" },
  { value: "booking", label: "Booking & scheduling" },
  { value: "documents", label: "Document & file management" },
  { value: "maps", label: "Maps & geolocation" },
  { value: "ai", label: "AI / machine-learning features" },
];

export const integrationOptions: Option<IntegrationKey>[] = [
  { value: "payment_gateway", label: "Payment gateway" },
  { value: "sms", label: "SMS gateway" },
  { value: "whatsapp", label: "WhatsApp Business" },
  { value: "email_marketing", label: "Email marketing" },
  { value: "accounting", label: "Accounting software" },
  { value: "erp_crm", label: "ERP or CRM" },
  { value: "logistics", label: "Logistics & delivery" },
  { value: "social_login", label: "Social login" },
  { value: "analytics", label: "Analytics & tracking" },
  { value: "custom_api", label: "Custom third-party API" },
];

export const designOptions: Option<DesignScope>[] = [
  { value: "template", label: "Template-based", hint: "Adapt a proven layout to your brand" },
  { value: "standard", label: "Custom design", hint: "Bespoke screens from your existing brand" },
  { value: "premium", label: "Premium design system", hint: "Bespoke UI plus a reusable design system" },
  { value: "brand", label: "Brand + product design", hint: "Identity, brand system, and product UI" },
];

export const volumeOptions: Option<UserVolume>[] = [
  { value: "small", label: "Up to 1,000 users" },
  { value: "medium", label: "1,000 – 10,000 users" },
  { value: "large", label: "10,000 – 100,000 users" },
  { value: "xlarge", label: "100,000+ users" },
];

export const timelineOptions: Option<Timeline>[] = [
  { value: "flexible", label: "Flexible", hint: "No fixed deadline" },
  { value: "standard", label: "Standard", hint: "Typical delivery pace" },
  { value: "fast", label: "Fast", hint: "Compressed schedule" },
  { value: "urgent", label: "Urgent", hint: "Needed as soon as possible" },
];

export const maintenanceOptions: Option<MaintenancePlan>[] = [
  { value: "none", label: "Not required" },
  { value: "basic", label: "Warranty only", hint: "Bug fixes for 3 months" },
  { value: "standard", label: "Managed support", hint: "Monthly updates for 12 months" },
  { value: "premium", label: "SLA-backed support", hint: "Priority response for 12 months" },
];

export const budgetOptions: Option<BudgetBand>[] = [
  { value: "undisclosed", label: "Prefer not to say" },
  { value: "under_500k", label: "Under LKR 500,000" },
  { value: "500k_1m", label: "LKR 500,000 – 1,000,000" },
  { value: "1m_2_5m", label: "LKR 1,000,000 – 2,500,000" },
  { value: "2_5m_5m", label: "LKR 2,500,000 – 5,000,000" },
  { value: "over_5m", label: "Over LKR 5,000,000" },
];

function lookup<T extends string>(options: Option<T>[]) {
  const map = new Map(options.map((option) => [option.value, option.label]));
  return (value: T): string => map.get(value) ?? value;
}

export const serviceLabel = lookup(serviceOptions);
export const platformLabel = lookup(platformOptions);
export const featureLabel = lookup(featureOptions);
export const integrationLabel = lookup(integrationOptions);
export const designLabel = lookup(designOptions);
export const volumeLabel = lookup(volumeOptions);
export const timelineLabel = lookup(timelineOptions);
export const maintenanceLabel = lookup(maintenanceOptions);
export const budgetLabel = lookup(budgetOptions);
