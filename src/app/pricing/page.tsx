import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { IconBadge } from "@/components/ui/IconBadge";
import { Reveal } from "@/components/motion/Reveal";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";
import { PricingTiers } from "./PricingTiers";
import styles from "./pricing.module.css";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Transparent engagements for every stage — fixed-scope starting points or a fully bespoke partnership, always beginning with a clear milestone plan.",
};

export default function PricingPage() {
  return (
    <>
      <section className={styles.hero}>
        <div className={styles.heroBlob} aria-hidden />
        <Stagger mode="mount" stagger={0.1} delay={0.1} className={`container ${styles.heroInner}`}>
          <StaggerItem>
            <Eyebrow>Pricing</Eyebrow>
          </StaggerItem>
          <StaggerItem duration={0.7}>
            <h1 className={styles.h1}>
              Transparent engagements for every{" "}
              <span className="gradientText">stage</span>.
            </h1>
          </StaggerItem>
          <StaggerItem>
            <p className={styles.lead}>
              Fixed-scope starting points, or a fully bespoke partnership. Every
              project begins with a clear plan and a fixed first milestone.
            </p>
          </StaggerItem>
        </Stagger>
      </section>

      <div className="container">
        <PricingTiers />

        <section className={styles.noteWrap}>
          <Reveal>
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
          </Reveal>
        </section>
      </div>
    </>
  );
}
