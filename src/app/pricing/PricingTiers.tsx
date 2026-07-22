"use client";

import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
  type Variants,
} from "motion/react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { cx } from "@/lib/cx";
import { EASE } from "@/lib/animations";
import { pricingTiers, type PricingTier } from "@/content/pricing";
import styles from "./pricing.module.css";

const tierClass = {
  default: undefined,
  featured: styles.tierFeatured,
  dark: styles.tierDark,
} as const;

const tierButton = {
  default: "outline",
  featured: "accent",
  dark: "light",
} as const;

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

/** Each card reveals, then staggers its own feature checklist in. */
const cardVariants: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: EASE,
      staggerChildren: 0.06,
      delayChildren: 0.25,
    },
  },
};

const featureVariants: Variants = {
  hidden: { opacity: 0, x: -12 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.35, ease: EASE } },
};

/** Max the outer shadow shifts toward the cursor, in px. */
const SHADOW_REACH = 26;

/** Pricing card with a green shadow, cast around the card, that leans toward the cursor on hover. */
function TierCard({ tier }: { tier: PricingTier }) {
  const sx = useMotionValue(0);
  const sy = useMotionValue(0);
  const shadowX = useSpring(sx, { stiffness: 150, damping: 20 });
  const shadowY = useSpring(sy, { stiffness: 150, damping: 20 });

  // 0 = not hovered, 1 = hovered — springed so the shadow fades in/out smoothly
  // instead of being toggled on/off via the style prop (which left stale shadows behind).
  const t = useMotionValue(0);
  const tSpring = useSpring(t, { stiffness: 150, damping: 20 });
  const shadowAlpha = useTransform(tSpring, (v) => v * 0.55);
  const ringAlpha = useTransform(tSpring, (v) => v * 0.22);
  const boxShadow = useMotionTemplate`${shadowX}px ${shadowY}px 46px -6px rgba(40, 184, 95, ${shadowAlpha}), 0 0 0 1px rgba(40, 184, 95, ${ringAlpha})`;

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    sx.set((px - 0.5) * 2 * SHADOW_REACH);
    sy.set((py - 0.5) * 2 * SHADOW_REACH);
  };

  const onEnter = () => {
    t.set(1);
  };

  const onLeave = () => {
    t.set(0);
    sx.set(0);
    sy.set(0);
  };

  return (
    <motion.div
      className={cx(styles.tier, tierClass[tier.variant])}
      variants={cardVariants}
      whileHover={{ y: -5, transition: { duration: 0.25, ease: EASE } }}
      style={{ boxShadow }}
      onMouseMove={onMove}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      {tier.featured && <span className={styles.badge}>Most popular</span>}
      <h3 className={styles.name}>{tier.name}</h3>
      <p className={styles.blurb}>{tier.blurb}</p>
      <div className={styles.priceRow}>
        <div className={styles.priceLabel}>{tier.priceLabel}</div>
        <div className={styles.price}>{tier.price}</div>
      </div>
      <div className={styles.features}>
        {tier.features.map((feature) => (
          <motion.div key={feature} className={styles.feature} variants={featureVariants}>
            <Icon name="check_circle" size={19} className={styles.featureIcon} />
            {feature}
          </motion.div>
        ))}
      </div>
      <Button href="/contact" variant={tierButton[tier.variant]} block>
        {tier.cta}
      </Button>
    </motion.div>
  );
}

export function PricingTiers() {
  return (
    <motion.section
      className={styles.tiers}
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
    >
      {pricingTiers.map((tier) => (
        <TierCard key={tier.name} tier={tier} />
      ))}
    </motion.section>
  );
}
