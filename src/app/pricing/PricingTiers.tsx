"use client";

import { motion, type Variants } from "motion/react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { cx } from "@/lib/cx";
import { EASE } from "@/lib/animations";
import { pricingTiers } from "@/content/pricing";
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
        <motion.div
          key={tier.name}
          className={cx(styles.tier, tierClass[tier.variant])}
          variants={cardVariants}
          whileHover={{ y: -5, transition: { duration: 0.25, ease: EASE } }}
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
      ))}
    </motion.section>
  );
}
