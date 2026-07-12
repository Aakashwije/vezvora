import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Icon } from "@/components/ui/Icon";
import { IconBadge } from "@/components/ui/IconBadge";
import { cx } from "@/lib/cx";
import { pricingTiers } from "@/content/pricing";
import styles from "./pricing.module.css";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Transparent engagements for every stage — fixed-scope starting points or a fully bespoke partnership, always beginning with a clear milestone plan.",
};

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

export default function PricingPage() {
  return (
    <>
      <section className={styles.hero}>
        <div className={styles.heroBlob} aria-hidden />
        <div className={`container ${styles.heroInner}`}>
          <Eyebrow>Pricing</Eyebrow>
          <h1 className={styles.h1}>
            Transparent engagements for every{" "}
            <span className="gradientText">stage</span>.
          </h1>
          <p className={styles.lead}>
            Fixed-scope starting points, or a fully bespoke partnership. Every
            project begins with a clear plan and a fixed first milestone.
          </p>
        </div>
      </section>

      <div className="container">
        <section className={styles.tiers}>
          {pricingTiers.map((tier) => (
            <div key={tier.name} className={cx(styles.tier, tierClass[tier.variant])}>
              {tier.featured && <span className={styles.badge}>Most popular</span>}
              <h3 className={styles.name}>{tier.name}</h3>
              <p className={styles.blurb}>{tier.blurb}</p>
              <div className={styles.priceRow}>
                <div className={styles.priceLabel}>{tier.priceLabel}</div>
                <div className={styles.price}>{tier.price}</div>
              </div>
              <div className={styles.features}>
                {tier.features.map((feature) => (
                  <div key={feature} className={styles.feature}>
                    <Icon name="check_circle" size={19} className={styles.featureIcon} />
                    {feature}
                  </div>
                ))}
              </div>
              <Button href="/contact" variant={tierButton[tier.variant]} block>
                {tier.cta}
              </Button>
            </div>
          ))}
        </section>

        <section className={styles.noteWrap}>
          <div className={styles.note}>
            <IconBadge name="verified" size={46} iconSize={24} radius={12} />
            <div className={styles.noteBody}>
              <div className={styles.noteTitle}>
                Every engagement includes a fixed-price discovery sprint.
              </div>
              <div className={styles.noteText}>
                Two weeks to align on scope, architecture, and a milestone plan —
                fully credited toward your build.
              </div>
            </div>
            <Button href="/contact" variant="dark" size="sm" icon="arrow_outward" iconSize={17}>
              Talk to us
            </Button>
          </div>
        </section>
      </div>
    </>
  );
}
