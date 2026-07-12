import { Fragment } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Icon } from "@/components/ui/Icon";
import { IconBadge } from "@/components/ui/IconBadge";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { CtaSection } from "@/components/sections/CtaSection";
import { heroStats, trustLogos, homeServices, processSteps } from "@/content/home";
import styles from "./page.module.css";

const heroBars = [
  { h: 42, fill: "#eff3ec", delay: "0.05s" },
  { h: 58, fill: "#e7f0e3", delay: "0.12s" },
  { h: 50, fill: "#eff3ec", delay: "0.19s" },
  { h: 73, fill: "linear-gradient(180deg,#9fce22,#3bb85e)", delay: "0.26s" },
  { h: 64, fill: "#e7f0e3", delay: "0.33s" },
  { h: 88, fill: "linear-gradient(180deg,#8ec21a,#28b85f 55%,#2fd3c4)", delay: "0.4s" },
  { h: 70, fill: "#e7f0e3", delay: "0.47s" },
];

const featuredBars = [40, 62, 52, 80, 68, 94].map((h, i) => ({
  h,
  fill:
    i === 3
      ? "linear-gradient(180deg,#9fce22,#3bb85e)"
      : i === 5
        ? "linear-gradient(180deg,#8ec21a,#2fd3c4)"
        : "#dfeed6",
}));

const featuredStats = [
  { value: "71%", label: "Faster loads", color: "#a9e022" },
  { value: "2.4M", label: "Daily events", color: "#3bd6c0" },
  { value: "$4.1M", label: "New ARR", color: "#63d17f" },
];

export default function HomePage() {
  return (
    <>
      {/* HERO */}
      <section className={styles.hero}>
        <div className={styles.heroBlob} aria-hidden />
        <div className={`container ${styles.heroGrid}`}>
          <div>
            <div className={styles.badge}>
              <span className={styles.badgeDot} aria-hidden />
              <span className={styles.badgeText}>
                Now booking Q3 engineering partnerships
              </span>
            </div>
            <h1 className={styles.h1}>
              Software that moves your business{" "}
              <span className="gradientText">forward</span>.
            </h1>
            <p className={styles.lead}>
              We design and engineer high-performance mobile apps, web platforms,
              and custom systems built to accelerate growth and scale without
              friction.
            </p>
            <div className={styles.heroActions}>
              <Button href="/contact" variant="accent" icon="arrow_forward" iconSize={19}>
                Start a project
              </Button>
              <Button href="/work" variant="outline">
                View our work
              </Button>
            </div>
            <div className={styles.stats}>
              {heroStats.map((stat, i) => (
                <Fragment key={stat.label}>
                  {i > 0 && <span className={styles.statDivider} aria-hidden />}
                  <div>
                    <div className={styles.statValue}>
                      {stat.value}
                      {stat.suffix && <span className={styles.statSuffix}>{stat.suffix}</span>}
                    </div>
                    <div className={styles.statLabel}>{stat.label}</div>
                  </div>
                </Fragment>
              ))}
            </div>
          </div>

          {/* Dashboard mock */}
          <div className={styles.mock}>
            <div className={styles.mockCard}>
              <div className={styles.mockTop}>
                <div className={styles.dots}>
                  <span className={styles.dot} />
                  <span className={styles.dot} />
                  <span className={styles.dot} />
                </div>
                <span className={styles.mockUrl}>app.vezvora.io</span>
              </div>
              <div className={styles.mockBody}>
                <div className={styles.mockHead}>
                  <div>
                    <div className={styles.mockKpiLabel}>Monthly growth</div>
                    <div className={styles.mockKpiValue}>+124.8%</div>
                  </div>
                  <span className={styles.mockDelta}>
                    <Icon name="arrow_upward" size={15} />
                    18.2%
                  </span>
                </div>
                <div className={styles.chart}>
                  {heroBars.map((bar, i) => (
                    <span
                      key={i}
                      className={styles.chartBar}
                      style={{ height: `${bar.h}%`, background: bar.fill, animationDelay: bar.delay }}
                    />
                  ))}
                </div>
                <div className={styles.mockDivider} />
                <div className={styles.miniStats}>
                  <div className={styles.miniStat}>
                    <div className={styles.miniLabel}>Active users</div>
                    <div className={styles.miniValue}>48,209</div>
                  </div>
                  <div className={styles.miniStat}>
                    <div className={styles.miniLabel}>Uptime</div>
                    <div className={styles.miniValue}>99.98%</div>
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.floatChip}>
              <span className={styles.floatIcon}>
                <Icon name="bolt" size={22} />
              </span>
              <div>
                <div className={styles.floatLabel}>Deploy time</div>
                <div className={styles.floatValue}>–63% faster</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section className={styles.trust}>
        <div className={`container ${styles.trustInner}`}>
          <span className={styles.trustLabel}>Trusted by teams building the future</span>
          <div className={styles.trustLogos}>
            {trustLogos.map((logo) => (
              <span key={logo} className={styles.trustLogo}>
                {logo}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className={styles.services}>
        <div className="container">
          <SectionHeading
            className={styles.servicesHead}
            eyebrow="What we do"
            title="Engineering excellence, end to end."
            intro="Comprehensive digital solutions built for scale, speed, and reliability — from first sketch to production."
          />
          <div className={styles.grid4}>
            {homeServices.map((service) => (
              <article key={service.title} className={styles.serviceCard}>
                <IconBadge name={service.icon} />
                <h3 className={styles.serviceTitle}>{service.title}</h3>
                <p className={styles.serviceDesc}>{service.desc}</p>
                <Link href="/services" className={styles.serviceLink}>
                  Learn more
                  <Icon name="arrow_forward" size={16} />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED WORK */}
      <section className={styles.featured}>
        <div className="container">
          <div className={styles.featuredBand}>
            <div className={styles.featuredBlob} aria-hidden />
            <div className={styles.featuredGrid}>
              <div className={styles.featuredCopy}>
                <Eyebrow tone="light">Featured work</Eyebrow>
                <h2 className={styles.featuredTitle}>
                  A logistics platform rebuilt for 10× scale.
                </h2>
                <p className={styles.featuredText}>
                  We re-architected a legacy operations suite into a real-time
                  platform handling millions of daily events — cutting load times
                  by 71% and unlocking a new revenue line.
                </p>
                <div className={styles.featuredStats}>
                  {featuredStats.map((stat) => (
                    <div key={stat.label}>
                      <div className={styles.fStatValue} style={{ color: stat.color }}>
                        {stat.value}
                      </div>
                      <div className={styles.fStatLabel}>{stat.label}</div>
                    </div>
                  ))}
                </div>
                <Button href="/work" variant="accent" icon="arrow_forward">
                  Read the case study
                </Button>
              </div>

              <div className={styles.featuredMockWrap}>
                <div className={styles.featuredMock}>
                  <div className={styles.fmHead}>
                    <span className={styles.fmTitle}>Operations</span>
                    <span className={styles.fmLive}>
                      <span className={styles.fmLiveDot} />
                      Live
                    </span>
                  </div>
                  <div className={styles.fmGrid}>
                    <div className={styles.fmCell}>
                      <div className={styles.fmCellLabel}>Throughput</div>
                      <div className={styles.fmCellValue}>28.4k/s</div>
                    </div>
                    <div className={styles.fmCell}>
                      <div className={styles.fmCellLabel}>Latency</div>
                      <div className={styles.fmCellValue}>42ms</div>
                    </div>
                  </div>
                  <div className={styles.fmChartWrap}>
                    <div className={styles.fmChart}>
                      {featuredBars.map((bar, i) => (
                        <span
                          key={i}
                          className={styles.fmBar}
                          style={{ height: `${bar.h}%`, background: bar.fill }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROCESS */}
      <section className={styles.process}>
        <div className="container">
          <SectionHeading
            className={styles.processHead}
            eyebrow="How we work"
            title="A process engineered for momentum."
          />
          <div className={styles.processGrid}>
            {processSteps.map((step) => (
              <div key={step.num} className={styles.processCell}>
                <div className={styles.processNum}>{step.num}</div>
                <h3 className={styles.processTitle}>{step.title}</h3>
                <p className={styles.processDesc}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <CtaSection
        title={
          <>
            Let&apos;s build something that{" "}
            <span className="gradientText">moves</span>.
          </>
        }
        text="Tell us where you want to go. We'll map the fastest engineering path to get there."
        action={{ label: "Book a call", href: "/contact", icon: "arrow_outward" }}
      />
    </>
  );
}
