import Script from "next/script";
import { siteConfig } from "@/lib/site";

/**
 * Plausible — cookieless, privacy-first analytics.
 *
 * Renders nothing unless `NEXT_PUBLIC_PLAUSIBLE_ENABLED` is "true", so local
 * development and preview builds never pollute the stats. Set it in the
 * production environment only.
 *
 * Optional overrides:
 *   NEXT_PUBLIC_PLAUSIBLE_DOMAIN — defaults to the site domain
 *   NEXT_PUBLIC_PLAUSIBLE_HOST   — point at a self-hosted instance
 */
export function Analytics() {
  if (process.env.NEXT_PUBLIC_PLAUSIBLE_ENABLED !== "true") return null;

  const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN ?? siteConfig.domain;
  const host = process.env.NEXT_PUBLIC_PLAUSIBLE_HOST ?? "https://plausible.io";

  return (
    <Script
      defer
      data-domain={domain}
      src={`${host}/js/script.js`}
      strategy="afterInteractive"
    />
  );
}
