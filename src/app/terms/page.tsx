import type { Metadata } from "next";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/motion/Reveal";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";
import { termsIntro, termsSections, termsUpdated } from "@/content/terms";
import { siteConfig } from "@/lib/site";
import styles from "./terms.module.css";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description:
    "The terms and conditions that govern your use of the Vezvora website and the software design and engineering services we provide.",
};

export default function TermsPage() {
  return (
    <div className="container">
      <section className={styles.hero}>
        <Stagger mode="mount" stagger={0.1} delay={0.1}>
          <StaggerItem>
            <Eyebrow>Legal</Eyebrow>
          </StaggerItem>
          <StaggerItem duration={0.7}>
            <h1 className={styles.h1}>
              Terms &amp; <span className="gradientText">Conditions</span>
            </h1>
          </StaggerItem>
          <StaggerItem>
            <p className={styles.updated}>Last updated: {termsUpdated}</p>
          </StaggerItem>
          <StaggerItem>
            <p className={styles.lead}>{termsIntro}</p>
          </StaggerItem>
        </Stagger>
      </section>

      <section className={styles.body}>
        {termsSections.map((section) => (
          <Reveal key={section.title} className={styles.section}>
            <h2 className={styles.sectionTitle}>{section.title}</h2>
            {section.body.map((paragraph, i) => (
              <p key={i} className={styles.paragraph}>
                {paragraph}
              </p>
            ))}
          </Reveal>
        ))}

        <Reveal className={styles.contact}>
          <h2 className={styles.sectionTitle}>Contact us</h2>
          <p className={styles.paragraph}>
            If you have any questions about these Terms &amp; Conditions, please
            reach out at{" "}
            <a className={styles.link} href={`mailto:${siteConfig.email}`}>
              {siteConfig.email}
            </a>
            , or write to us at {siteConfig.office}.
          </p>
        </Reveal>
      </section>
    </div>
  );
}
