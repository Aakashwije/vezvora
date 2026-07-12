"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { navLinks } from "@/lib/site";
import { cx } from "@/lib/cx";
import { Button } from "@/components/ui/Button";
import { Logo } from "./Logo";
import styles from "./Navbar.module.css";

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const closeMenu = () => setOpen(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className={styles.header}>
      <div className={cx("container", styles.inner)}>
        <Link href="/" className={styles.brand} aria-label="Vezvora — home">
          <Logo />
        </Link>

        <nav className={styles.links} aria-label="Primary">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cx(styles.link, isActive(link.href) && styles.active)}
              aria-current={isActive(link.href) ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className={styles.cta}>
          <Button href="/contact" variant="dark" size="sm" icon="arrow_outward" iconSize={17}>
            Book a call
          </Button>
        </div>

        <button
          type="button"
          className={styles.toggle}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={22} aria-hidden /> : <Menu size={22} aria-hidden />}
        </button>
      </div>

      <div className={cx(styles.mobile, open && styles.mobileOpen)}>
        <nav className={styles.mobileLinks} aria-label="Mobile">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cx(styles.mobileLink, isActive(link.href) && styles.active)}
              aria-current={isActive(link.href) ? "page" : undefined}
              onClick={closeMenu}
            >
              {link.label}
            </Link>
          ))}
          <Button
            href="/contact"
            variant="dark"
            size="md"
            icon="arrow_outward"
            iconSize={17}
            className={styles.mobileCta}
            onClick={closeMenu}
          >
            Book a call
          </Button>
        </nav>
      </div>
    </header>
  );
}
