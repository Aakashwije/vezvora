/**
 * Site-wide configuration: navigation, footer and contact details.
 * Keeping this in one place guarantees the shared chrome (navbar + footer)
 * stays identical across every page.
 */

export type NavLink = { label: string; href: string };

export const siteConfig = {
  name: "VEZVORA",
  domain: "vezvora.io",
  tagline: "Engineering digital momentum.",
  description:
    "We build the platforms that power tomorrow's leading enterprises.",
  email: "vezvoraa@gmail.com",
  phone: "+94 71 357 9967",
  whatsappUrl: "https://wa.me/94713579967",
  office: "193/12 , Prasanna Uyana , Mattegoda , Sri Lanka",
};

/** Primary navigation — order matters and drives the active state. */
export const navLinks: NavLink[] = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/services" },
  { label: "Work", href: "/work" },
  { label: "Pricing", href: "/pricing" },
  { label: "About", href: "/about" },
];

export const footerNav: { title: string; links: NavLink[] }[] = [
  {
    title: "Company",
    links: [
      { label: "Services", href: "/services" },
      { label: "Work", href: "/work" },
      { label: "About", href: "/about" },
      { label: "Pricing", href: "/pricing" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Case studies", href: "/work" },
      { label: "Blog", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "#" },
      { label: "Terms", href: "#" },
    ],
  },
];
