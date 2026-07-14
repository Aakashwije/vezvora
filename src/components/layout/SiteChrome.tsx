"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { isAdminRoute } from "@/lib/routes";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

/**
 * Switches the outer chrome by route: the marketing navbar + footer render on
 * the public site, but the admin console (/admin/*) provides its own shell, so
 * the marketing chrome is omitted there entirely.
 */
export function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (isAdminRoute(pathname)) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />
      <main id="main">{children}</main>
      <Footer />
    </>
  );
}
