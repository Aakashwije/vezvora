import { siteConfig } from "@/lib/site";

/**
 * Organization + WebSite structured data (schema.org / JSON-LD).
 * Helps search engines build a knowledge panel and sitelinks. Rendered
 * once from the root layout; safe as a server component.
 */
export function JsonLd() {
  const base = `https://${siteConfig.domain}`;

  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${base}/#organization`,
        name: siteConfig.name,
        url: base,
        description: siteConfig.description,
        email: siteConfig.email,
        telephone: siteConfig.phone,
        logo: {
          "@type": "ImageObject",
          url: `${base}/logo-mark.webp`,
        },
        address: {
          "@type": "PostalAddress",
          streetAddress: siteConfig.office,
          addressCountry: "LK",
        },
        contactPoint: {
          "@type": "ContactPoint",
          telephone: siteConfig.phone,
          email: siteConfig.email,
          contactType: "sales",
          availableLanguage: ["English"],
        },
      },
      {
        "@type": "WebSite",
        "@id": `${base}/#website`,
        url: base,
        name: siteConfig.name,
        description: siteConfig.description,
        publisher: { "@id": `${base}/#organization` },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      // Structured data is static and built from trusted config values.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}
