import type { Metadata } from "next";
import { jakarta, inter } from "@/lib/fonts";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { siteConfig } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(`https://${siteConfig.domain}`),
  title: {
    default: "Vezvora — Software that moves your business forward",
    template: "%s · Vezvora",
  },
  description:
    "Vezvora designs and engineers high-performance mobile apps, web platforms, POS, and custom systems built to accelerate growth and scale without friction.",
  keywords: [
    "software engineering",
    "mobile app development",
    "web platforms",
    "POS systems",
    "custom software",
    "product design",
  ],
  openGraph: {
    type: "website",
    title: "Vezvora — Software that moves your business forward",
    description: siteConfig.description,
    siteName: siteConfig.name,
    url: `https://${siteConfig.domain}`,
  },
  twitter: {
    card: "summary_large_image",
    title: "Vezvora — Software that moves your business forward",
    description: siteConfig.description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${jakarta.variable} ${inter.variable}`}>
      <body>
        <MotionProvider>
          <SiteChrome>{children}</SiteChrome>
        </MotionProvider>
      </body>
    </html>
  );
}
