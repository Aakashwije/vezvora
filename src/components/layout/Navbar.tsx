"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
  type Variants,
} from "motion/react";
import { Menu, X } from "lucide-react";
import { navLinks } from "@/lib/site";
import { cx } from "@/lib/cx";
import { EASE } from "@/lib/animations";
import { Button } from "@/components/ui/Button";
import { Logo } from "./Logo";
import styles from "./Navbar.module.css";

const menuVariants: Variants = {
  hidden: { opacity: 0, height: 0 },
  visible: {
    opacity: 1,
    height: "auto",
    transition: {
      duration: 0.32,
      ease: EASE,
      staggerChildren: 0.05,
      delayChildren: 0.04,
    },
  },
  exit: { opacity: 0, height: 0, transition: { duration: 0.22, ease: EASE } },
};

const menuItemVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: EASE } },
};

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const { scrollY } = useScroll();
  const closeMenu = () => setOpen(false);

  // Glass treatment once scrolled; fade the bar out while scrolling down,
  // back in as soon as the user scrolls up.
  useMotionValueEvent(scrollY, "change", (y) => {
    const previous = scrollY.getPrevious() ?? 0;
    setScrolled(y > 12);
    if (open) {
      setHidden(false);
      return;
    }
    setHidden(y > 160 && y > previous);
  });

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <motion.header
      className={cx(styles.header, scrolled && styles.scrolled)}
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: hidden ? -14 : 0, opacity: hidden ? 0 : 1 }}
      transition={{ duration: 0.35, ease: EASE }}
      style={{ pointerEvents: hidden ? "none" : "auto" }}
    >
      <div className={cx("container", styles.inner)}>
        <Link href="/" className={styles.brand} aria-label="Vezvora — home">
          <motion.span
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.1 }}
            className={styles.brandMark}
          >
            <Logo />
          </motion.span>
        </Link>

        <nav className={styles.links} aria-label="Primary">
          {navLinks.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cx(styles.link, active && styles.active)}
                aria-current={active ? "page" : undefined}
              >
                {link.label}
                {active && (
                  <motion.span
                    layoutId="nav-underline"
                    className={styles.underline}
                    transition={{ duration: 0.35, ease: EASE }}
                  />
                )}
              </Link>
            );
          })}
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

      <AnimatePresence>
        {open && (
          <motion.div
            className={styles.mobile}
            variants={menuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <nav className={styles.mobileLinks} aria-label="Mobile">
              {navLinks.map((link) => (
                <motion.div key={link.href} variants={menuItemVariants}>
                  <Link
                    href={link.href}
                    className={cx(styles.mobileLink, isActive(link.href) && styles.active)}
                    aria-current={isActive(link.href) ? "page" : undefined}
                    onClick={closeMenu}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              <motion.div variants={menuItemVariants}>
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
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
