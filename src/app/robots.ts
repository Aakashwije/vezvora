import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const base = `https://${siteConfig.domain}`;

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Keep the private admin console out of search indexes.
      disallow: ["/admin", "/admin/"],
    },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
