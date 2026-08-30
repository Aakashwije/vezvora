import type { Metadata } from "next";
import { Reveal } from "@/components/motion/Reveal";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Icon } from "@/components/ui/Icon";
import { siteConfig } from "@/lib/site";
import { EstimateForm } from "./EstimateForm";
import styles from "./quotation.module.css";

export const metadata: Metadata = {
  title: "Instant Estimate",
  description:
    "Tell us what you are building and get an approximate Vezvora quotation — itemised scope, price range, and delivery estimate — emailed to you as a PDF.",
  alternates: { canonical: "/quotation" },
};

const HIGHLIGHTS = [
  { icon: "bolt", label: "Itemised in minutes" },
  { icon: "file", label: "PDF quotation by email" },
  { icon: "shield", label: "No obligation" },
] as const;

const HOW_IT_WORKS = [
  {
    title: "Tell us the scope",
    body: "Five short steps covering your contact details, the product, its features, and how fast you need it.",
  },
  {
    title: "We price it instantly",
    body: "Our estimator itemises every platform, feature, and integration against our current rate card.",
  },
  {
    title: "A specialist reviews it",
    body: "An engineer checks the numbers against comparable projects before the quotation is released.",
  },
  {
    title: "The PDF lands in your inbox",
    body: "A full quotation with scope, price range, delivery window, assumptions, and payment terms.",
  },
];

export default function QuotationPage() {
  return (
    <div className="container">
      <section className={styles.hero}>
        <Stagger mode="mount" stagger={0.1} delay={0.1}>
          <StaggerItem>
            <Eyebrow>Instant estimate</Eyebrow>
          </StaggerItem>
          <StaggerItem duration={0.7}>
            <h1 className={styles.h1}>
              Get an approximate quotation in{" "}
              <span className="gradientText">minutes</span>.
            </h1>
          </StaggerItem>
          <StaggerItem>
            <p className={styles.lead}>
              Describe what you are building and our estimator itemises the scope, prices each
              part, and emails you a full PDF quotation — no sales call required.
            </p>
          </StaggerItem>
          <StaggerItem className={styles.heroMeta}>
            {HIGHLIGHTS.map((highlight) => (
              <span key={highlight.label} className={styles.heroMetaItem}>
                <Icon name={highlight.icon} size={17} className={styles.heroMetaIcon} />
                {highlight.label}
              </span>
            ))}
          </StaggerItem>
        </Stagger>
      </section>

      <section className={styles.layout}>
        <Reveal mode="mount" delay={0.25}>
          <EstimateForm />
        </Reveal>

        <Stagger mode="mount" stagger={0.12} delay={0.35} className={styles.side}>
          <StaggerItem className={styles.sideCard}>
            <h2 className={styles.sideTitle}>How this works</h2>
            <ol className={styles.sideList}>
              {HOW_IT_WORKS.map((item) => (
                <li key={item.title} className={styles.sideItem}>
                  <Icon name="check_circle" size={17} className={styles.sideItemIcon} />
                  <span>
                    <strong className={styles.sideItemStrong}>{item.title}</strong>
                    {item.body}
                  </span>
                </li>
              ))}
            </ol>
          </StaggerItem>

          <StaggerItem className={styles.sideCard}>
            <h2 className={styles.sideTitle}>Prefer to talk it through?</h2>
            <a
              href={siteConfig.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.sideContact}
            >
              <Icon name="message" size={18} />
              Chat on WhatsApp
            </a>
            <a href={`mailto:${siteConfig.email}`} className={styles.sideContact}>
              <Icon name="mail" size={18} />
              {siteConfig.email}
            </a>
          </StaggerItem>
        </Stagger>
      </section>
    </div>
  );
}
