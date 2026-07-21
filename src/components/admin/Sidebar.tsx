"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Inbox,
  FolderKanban,
  Layers,
  CircleDollarSign,
  Star,
  Users,
  FileText,
  Briefcase,
  Scale,
  Settings,
  ChartColumn,
  Image as ImageIcon,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { cx } from "@/lib/cx";
import { useLeads } from "@/lib/admin/store";
import { logout } from "@/lib/admin/auth-actions";
import type { AdminUser } from "@/lib/admin/session";
import { Avatar } from "./Avatar";
import styles from "./admin.module.css";

type NavItem = {
  label: string;
  href?: string;
  icon: LucideIcon;
  soon?: boolean;
  badgeKey?: "newLeads";
};

type NavSection = { title: string; items: NavItem[] };

const SECTIONS: NavSection[] = [
  {
    title: "Overview",
    items: [{ label: "Dashboard", href: "/admin", icon: LayoutDashboard }],
  },
  {
    title: "Sales",
    items: [{ label: "Leads", href: "/admin/leads", icon: Inbox, badgeKey: "newLeads" }],
  },
  {
    title: "Content",
    items: [
      { label: "Work", href: "/admin/content", icon: FolderKanban },
      { label: "Services", icon: Layers, soon: true },
      { label: "Pricing", icon: CircleDollarSign, soon: true },
      { label: "Testimonials", icon: Star, soon: true },
      { label: "Team", icon: Users, soon: true },
    ],
  },
  {
    title: "Publishing",
    items: [
      { label: "Blog", icon: FileText, soon: true },
      { label: "Careers", icon: Briefcase, soon: true },
      { label: "Legal", icon: Scale, soon: true },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Settings", href: "/admin/settings", icon: Settings },
      { label: "Analytics", icon: ChartColumn, soon: true },
      { label: "Media", icon: ImageIcon, soon: true },
    ],
  },
];

export function Sidebar({ user }: { user: AdminUser }) {
  const pathname = usePathname();
  const leads = useLeads();
  const newLeads = leads.filter((l) => l.status === "new").length;

  const isActive = (href?: string) =>
    href ? (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href)) : false;

  return (
    <aside className={styles.sidebar}>
      <Link href="/admin" className={styles.sideBrand}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-mark.webp" alt="" className={styles.sideMark} width={32} height={26} />
        <span className={styles.sideBrandText}>
          <span className={styles.sideBrandName}>VEZVORA</span>
          <span className={styles.sideBrandTag}>Console</span>
        </span>
      </Link>

      <nav className={styles.nav} aria-label="Admin">
        {SECTIONS.map((section) => (
          <div key={section.title}>
            <div className={styles.navSection}>{section.title}</div>
            {section.items.map((item) => {
              const Glyph = item.icon;
              const active = isActive(item.href);
              const badge = item.badgeKey === "newLeads" && newLeads > 0 ? newLeads : null;

              if (item.soon || !item.href) {
                return (
                  <span
                    key={item.label}
                    className={cx(styles.navItem, styles.navItemSoon)}
                    aria-disabled
                  >
                    <Glyph size={18} strokeWidth={2} />
                    <span className={styles.navLabel}>{item.label}</span>
                    <span className={styles.navSoon}>Soon</span>
                  </span>
                );
              }

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cx(styles.navItem, active && styles.navItemActive)}
                  aria-current={active ? "page" : undefined}
                >
                  <Glyph size={18} strokeWidth={2} />
                  <span className={styles.navLabel}>{item.label}</span>
                  {badge !== null && <span className={styles.navBadge}>{badge}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className={styles.sideFooter}>
        <div className={styles.sideUser}>
          <Avatar name={user.name} size={34} />
          <div className={styles.sideUserMeta}>
            <div className={styles.sideUserName}>{user.name}</div>
            <div className={styles.sideUserRole}>{user.role}</div>
          </div>
          <form action={logout}>
            <button type="submit" className={styles.logoutBtn} aria-label="Sign out" title="Sign out">
              <LogOut size={16} />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
