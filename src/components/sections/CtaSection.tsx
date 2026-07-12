import type { ReactNode } from "react";
import { cx } from "@/lib/cx";
import { Button } from "@/components/ui/Button";
import type { IconName } from "@/components/ui/Icon";
import { Reveal } from "@/components/motion/Reveal";
import styles from "./CtaSection.module.css";

type CtaSectionProps = {
  variant?: "light" | "dark";
  title: ReactNode;
  text: ReactNode;
  action: {
    label: string;
    href: string;
    icon?: IconName;
  };
};

/**
 * Reusable closing call-to-action. `light` renders a white card (Home, About);
 * `dark` renders the deep-slate gradient band (Services).
 */
export function CtaSection({
  variant = "light",
  title,
  text,
  action,
}: CtaSectionProps) {
  const isDark = variant === "dark";

  return (
    <section className={cx("container", styles.section)}>
      <Reveal duration={0.7}>
        <div className={cx(styles.card, isDark ? styles.dark : styles.light)}>
          <div className={styles.inner}>
            <h2 className={isDark ? styles.titleDark : styles.titleLight}>
              {title}
            </h2>
            <p className={isDark ? styles.textDark : styles.textLight}>{text}</p>
            <Button
              href={action.href}
              variant={isDark ? "accent" : "dark"}
              size="lg"
              icon={action.icon ?? "arrow_outward"}
              iconSize={19}
            >
              {action.label}
            </Button>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
