import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";

/**
 * Public routes exposed to crawlers. The admin console is intentionally
 * excluded (and blocked in robots.ts) since it lives behind auth.
 */
const routes: { path: string; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]; priority: number }[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/services", changeFrequency: "monthly", priority: 0.9 },
  { path: "/work", changeFrequency: "weekly", priority: 0.9 },
  { path: "/pricing", changeFrequency: "monthly", priority: 0.8 },
  { path: "/about", changeFrequency: "monthly", priority: 0.7 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.8 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = `https://${siteConfig.domain}`;
  const lastModified = new Date();

  return routes.map(({ path, changeFrequency, priority }) => ({
    url: `${base}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}
