import Link from "next/link";
import { footerNav, siteConfig } from "@/lib/site";
import { Logo } from "./Logo";
import styles from "./Footer.module.css";

function XIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286ZM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065Zm1.782 13.019H3.555V9h3.564v11.452ZM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003Z" />
    </svg>
  );
}

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.top}>
          <div className={styles.brandCol}>
            <Link href="/" className={styles.brandLink} aria-label="Vezvora — home">
              <Logo size="sm" />
            </Link>
            <p className={styles.about}>
              {siteConfig.tagline} {siteConfig.description}
            </p>
          </div>

          {footerNav.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <div className={styles.colTitle}>{column.title}</div>
              <div className={styles.colLinks}>
                {column.links.map((link) =>
                  link.href.startsWith("/") ? (
                    <Link key={link.label} href={link.href} className={styles.colLink}>
                      {link.label}
                    </Link>
                  ) : (
                    <a key={link.label} href={link.href} className={styles.colLink}>
                      {link.label}
                    </a>
                  ),
                )}
              </div>
            </nav>
          ))}
        </div>

        <div className={styles.bottom}>
          <span className={styles.copy}>
            © {year} {siteConfig.name}. All rights reserved.
          </span>
          <div className={styles.social}>
            <a className={styles.socialLink} href="#" aria-label="Vezvora on X">
              <XIcon />
            </a>
            <a className={styles.socialLink} href="#" aria-label="Vezvora on LinkedIn">
              <LinkedInIcon />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
