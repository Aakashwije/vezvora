import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Icon } from "@/components/ui/Icon";
import { IconBadge } from "@/components/ui/IconBadge";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { CtaSection } from "@/components/sections/CtaSection";
import { aboutStats, aboutValues } from "@/content/about";
import styles from "./about.module.css";

export const metadata: Metadata = {
  title: "About",
  description:
    "Vezvora engineers high-performance, scalable software for businesses that demand precision and reliability. Meet the team building your digital future.",
};

export default function AboutPage() {
  return (
    <>
      <section className={`container ${styles.hero}`}>
        <div>
          <Eyebrow>About Vezvora</Eyebrow>
          <h1 className={styles.h1}>
            We build the software that powers modern{" "}
            <span className="gradientText">enterprise</span>.
          </h1>
          <p className={styles.lead}>
            Vezvora engineers high-performance, scalable solutions for businesses
            demanding precision and reliability. We are the architects of your
            digital future.
          </p>
          <div className={styles.actions}>
            <Button href="/contact" variant="accent" size="sm">
              Our mission
            </Button>
            <Button href="/work" variant="outline" size="sm">
              See our work
            </Button>
          </div>
        </div>
        <div className={styles.visual}>
          <span className={styles.visualPattern} aria-hidden />
          <span className={styles.visualIcon}>
            <Icon name="architecture" size={96} strokeWidth={1.5} />
          </span>
          <span className={styles.visualNote}>[ team / office photo ]</span>
        </div>
      </section>

      <section className={styles.statsWrap}>
        <div className="container">
          <div className={styles.stats}>
            <span className={styles.statsBlob} aria-hidden />
            {aboutStats.map((stat) => (
              <div key={stat.label} className={styles.stat}>
                <div className={styles.statValue} style={{ color: stat.tone }}>
                  {stat.value}
                </div>
                <div className={styles.statLabel}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.values}>
        <div className="container">
          <SectionHeading
            className={styles.valuesHead}
            eyebrow="How we operate"
            title="Principles that shape everything we ship."
          />
          <div className={styles.valuesGrid}>
            {aboutValues.map((value) => (
              <article key={value.title} className={styles.valueCard}>
                <IconBadge name={value.icon} size={48} iconSize={25} radius={13} />
                <h3 className={styles.valueTitle}>{value.title}</h3>
                <p className={styles.valueDesc}>{value.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <CtaSection
        title="Ready to transform your infrastructure?"
        text="Partner with Vezvora to engineer resilient, scalable, secure software tailored to your enterprise."
        action={{ label: "Book a call", href: "/contact", icon: "arrow_outward" }}
      />
    </>
  );
}
