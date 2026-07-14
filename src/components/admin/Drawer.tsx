"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { EASE } from "@/lib/animations";
import styles from "./admin.module.css";

type DrawerProps = {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
};

/** Right-hand slide-in panel with backdrop; closes on Escape / backdrop click. */
export function Drawer({ open, onClose, title, subtitle, children, footer }: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className={styles.drawerBackdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.aside
            className={styles.drawer}
            role="dialog"
            aria-modal="true"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.32, ease: EASE }}
          >
            <div className={styles.drawerHead}>
              <div>
                <div className={styles.drawerTitle}>{title}</div>
                {subtitle && <div className={styles.drawerSub}>{subtitle}</div>}
              </div>
              <button type="button" className={styles.iconBtn} onClick={onClose} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <div className={styles.drawerBody}>{children}</div>
            {footer && <div className={styles.drawerFoot}>{footer}</div>}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
