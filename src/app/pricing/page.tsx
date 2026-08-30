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

const ESTIMATE_STEPS = [
  "Describe the product and the platforms it runs on",
  "Pick the features and integrations you need",
  "Set your design scope, scale, and timeline",
  "Receive an itemised PDF quotation by email",
];

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

        <section className={styles.estimate} id="instant-estimate">
          <Reveal>
            <div className={styles.estimateCard}>
              <span className={styles.estimateBlob} aria-hidden />
              <div className={styles.estimateBody}>
                <Eyebrow tone="light">Instant estimate</Eyebrow>
                <h2 className={styles.estimateTitle}>
                  Get an instant estimate for your project.
                </h2>
                <p className={styles.estimateText}>
                  Answer five short questions and our estimator itemises your scope, prices every
                  platform and feature, and emails you an approximate PDF quotation with a delivery
                  window — usually within minutes.
                </p>
                <div className={styles.estimateActions}>
                  <Button href="/quotation" variant="accent" size="lg" icon="arrow_forward">
                    Get an instant estimate
                  </Button>
                  <Button href="/contact" variant="outline" size="lg">
                    Talk to an engineer
                  </Button>
                </div>
              </div>
              <ol className={styles.estimateSteps}>
                {ESTIMATE_STEPS.map((step, index) => (
                  <li key={step} className={styles.estimateStep}>
                    <span className={styles.estimateStepNum} aria-hidden>
                      {index + 1}
                    </span>
                    <span className={styles.estimateStepText}>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </Reveal>
        </section>

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
