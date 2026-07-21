import type { Metadata } from "next";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { IconBadge } from "@/components/ui/IconBadge";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { CtaSection } from "@/components/sections/CtaSection";
import { CountUp } from "@/components/motion/CountUp";
import { Reveal } from "@/components/motion/Reveal";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";
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
        <Stagger mode="mount" stagger={0.1} delay={0.1}>
          <StaggerItem>
            <Eyebrow>About Vezvora</Eyebrow>
          </StaggerItem>
          <StaggerItem duration={0.7}>
            <h1 className={styles.h1}>
              We build the software that powers modern{" "}
              <span className="gradientText">enterprise</span>.
            </h1>
          </StaggerItem>
          <StaggerItem>
            <p className={styles.lead}>
              Vezvora engineers high-performance, scalable solutions for businesses
              demanding precision and reliability. We are the architects of your
              digital future.
            </p>
          </StaggerItem>
          <StaggerItem className={styles.actions}>
            <Button href="/contact" variant="accent" size="sm">
              Our mission
            </Button>
            <Button href="/work" variant="outline" size="sm">
              See our work
            </Button>
          </StaggerItem>
        </Stagger>
        <Reveal mode="mount" variant="scaleIn" delay={0.35} className={styles.visual}>
          <Image
            src="/team.webp"
            alt="The Vezvora team"
            fill
            priority
            sizes="(max-width: 900px) 420px, 559px"
            className={styles.teamImage}
          />
        </Reveal>
      </section>

      <section className={styles.statsWrap}>
        <div className="container">
          <Reveal>
            <div className={styles.stats}>
              <span className={styles.statsBlob} aria-hidden />
              {aboutStats.map((stat) => (
                <div key={stat.label} className={styles.stat}>
                  <div className={styles.statValue} style={{ color: stat.tone }}>
                    <CountUp value={stat.value} />
                  </div>
                  <div className={styles.statLabel}>{stat.label}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className={styles.values}>
        <div className="container">
          <Reveal>
            <SectionHeading
              className={styles.valuesHead}
              eyebrow="How we operate"
              title="Principles that shape everything we ship."
            />
          </Reveal>
          <Stagger className={styles.valuesGrid} stagger={0.1}>
            {aboutValues.map((value) => (
              <StaggerItem
                key={value.title}
                as="article"
                className={styles.valueCard}
                hoverLift
              >
                <IconBadge name={value.icon} size={48} iconSize={25} radius={13} />
                <h3 className={styles.valueTitle}>{value.title}</h3>
                <p className={styles.valueDesc}>{value.desc}</p>
              </StaggerItem>
            ))}
          </Stagger>
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
