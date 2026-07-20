import { CountUp } from "@/components/motion/CountUp";
import { Reveal } from "@/components/motion/Reveal";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";
import { CtaSection } from "@/components/sections/CtaSection";
import { FeaturedWork } from "@/components/sections/FeaturedWork";
import { HeroMock } from "@/components/sections/HeroMock";
import { ProcessSection } from "@/components/sections/ProcessSection";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { IconBadge } from "@/components/ui/IconBadge";
import { SectionHeading } from "@/components/ui/SectionHeading";
import {
  heroStats,
  homeServices,
  processSteps,
  testimonials,
  trustLogos,
} from "@/content/home";
import Image from "next/image";
import Link from "next/link";
import { Fragment } from "react";
import styles from "./page.module.css";

export default function HomePage() {
  return (
    <>
      {/* HERO */}
      <section className={styles.hero}>
        <div className={styles.heroBlob} aria-hidden />
        <div className={styles.heroSignal}>
          <span className={styles.heroSignalIcon} aria-hidden>
            <Icon name="shield" size={18} />
          </span>
          <span>
            <strong>Production-ready</strong>
            <small>Secure, scalable, monitored</small>
          </span>
        </div>
        <div className={`container ${styles.heroGrid}`}>
          <Stagger mode="mount" stagger={0.1} delay={0.15}>
            <StaggerItem className={styles.badge}>
              <span className={styles.badgeDot} aria-hidden />
              <span className={styles.badgeText}>
                Now booking Q3 engineering partnerships
              </span>
            </StaggerItem>
            <StaggerItem duration={0.7}>
              <h1 className={styles.h1}>
                Software that moves your business{" "}
                <span className="gradientText">forward</span>.
              </h1>
            </StaggerItem>
            <StaggerItem>
              <p className={styles.lead}>
                We design and engineer high-performance mobile apps, web
                platforms, and custom systems built to accelerate growth and
                scale without friction.
              </p>
            </StaggerItem>
            <StaggerItem className={styles.heroActions}>
              <Button
                href="/contact"
                variant="accent"
                icon="arrow_forward"
                iconSize={19}
              >
                Start a project
              </Button>
              <Button href="/work" variant="outline">
                View our work
              </Button>
            </StaggerItem>
            <StaggerItem className={styles.stats}>
              {heroStats.map((stat, i) => (
                <Fragment key={stat.label}>
                  {i > 0 && <span className={styles.statDivider} aria-hidden />}
                  <div>
                    <div className={styles.statValue}>
                      <CountUp value={stat.value} />
                      {stat.suffix && (
                        <span className={styles.statSuffix}>{stat.suffix}</span>
                      )}
                    </div>
                    <div className={styles.statLabel}>{stat.label}</div>
                  </div>
                </Fragment>
              ))}
            </StaggerItem>
          </Stagger>

          {/* Dashboard mock */}
          <HeroMock className={styles.mock} />
        </div>
      </section>

      {/* TRUST */}
      <section className={styles.trust}>
        <Reveal variant="fadeIn" className={`container ${styles.trustInner}`}>
          <span className={styles.trustLabel}>
            Trusted by teams building the future
          </span>
          <div className={styles.trustLogos}>
            {trustLogos.map((logo) => (
              <span key={logo.name} className={styles.trustLogo}>
                <Image
                  src={logo.src}
                  alt={`${logo.name} logo`}
                  fill
                  sizes="(max-width: 620px) 145px, 170px"
                  className={styles.trustLogoImage}
                />
              </span>
            ))}
          </div>
        </Reveal>
      </section>

      {/* SERVICES */}
      <section className={styles.services}>
        <div className="container">
          <Reveal>
            <SectionHeading
              className={styles.servicesHead}
              eyebrow="What we do"
              title="Engineering excellence, end to end."
              intro="Comprehensive digital solutions built for scale, speed, and reliability - from first sketch to production."
            />
          </Reveal>
          <Stagger className={styles.grid4} stagger={0.09}>
            {homeServices.map((service) => (
              <StaggerItem
                key={service.title}
                as="article"
                className={styles.serviceCard}
                hoverLift
              >
                <IconBadge name={service.icon} className={styles.serviceIcon} />
                <h3 className={styles.serviceTitle}>{service.title}</h3>
                <p className={styles.serviceDesc}>{service.desc}</p>
                <Link href="/services" className={styles.serviceLink}>
                  Learn more
                  <Icon name="arrow_forward" size={16} />
                </Link>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* FEATURED WORK */}
      <FeaturedWork />

      {/* TESTIMONIALS */}
      <section className={styles.testimonials}>
        <div className="container">
          <Reveal>
            <SectionHeading
              className={styles.testimonialsHead}
              eyebrow="What our customers say"
              title="Built together. Trusted to deliver."
              intro="A few words from the teams we work alongside."
            />
          </Reveal>
          <Stagger className={styles.testimonialsGrid} stagger={0.12}>
            {testimonials.map((testimonial, index) => (
              <StaggerItem
                key={testimonial.company}
                as="article"
                className={`${styles.testimonialCard} ${
                  testimonial.featured ? styles.testimonialFeatured : ""
                }`}
                hoverLift
              >
                <div className={styles.testimonialTop}>
                  <span className={styles.testimonialLogo}>
                    <Image
                      src={testimonial.logo}
                      alt={`${testimonial.company} logo`}
                      fill
                      sizes="88px"
                      className={`${styles.testimonialLogoImage} ${
                        index === 2 ? styles.testimonialLogoImageLarge : ""
                      }`}
                    />
                  </span>
                  {testimonial.draft && (
                    <span className={styles.testimonialDraft}>Draft copy</span>
                  )}
                </div>
                <blockquote className={styles.testimonialQuote}>
                  “
                  {testimonial.quote
                    .split(/(90%|100\+|praise the convincing experience)/)
                    .map((part, partIndex) =>
                      part === "90%" ||
                      part === "100+" ||
                      part === "praise the convincing experience" ? (
                      <mark key={partIndex} className={styles.testimonialHighlight}>
                        {part}
                      </mark>
                    ) : (
                      <Fragment key={partIndex}>{part}</Fragment>
                    ),
                    )}
                  ”
                </blockquote>
                <div className={styles.testimonialPerson}>
                  <strong>{testimonial.name}</strong>
                  <span>
                    {testimonial.role} · {testimonial.company}
                  </span>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* PROCESS */}
      <ProcessSection steps={processSteps} />

      {/* CTA */}
      <CtaSection
        title={
          <>
            Let&apos;s build something that{" "}
            <span className="gradientText">moves</span>.
          </>
        }
        text="Tell us where you want to go. We'll map the fastest engineering path to get there."
        action={{
          label: "Book a call",
          href: "/contact",
          icon: "arrow_outward",
        }}
      />
    </>
  );
}
