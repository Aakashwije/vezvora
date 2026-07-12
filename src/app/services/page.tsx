import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Icon } from "@/components/ui/Icon";
import { IconBadge } from "@/components/ui/IconBadge";
import { CtaSection } from "@/components/sections/CtaSection";
import { services } from "@/content/services";
import styles from "./services.module.css";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Mobile apps, web platforms, POS systems and custom software — designed and engineered end to end for growth, speed, and reliability.",
};

export default function ServicesPage() {
  return (
    <>
      <section className={styles.hero}>
        <div className={styles.heroBlob} aria-hidden />
        <div className={`container ${styles.heroInner}`}>
          <Eyebrow>What we do</Eyebrow>
          <h1 className={styles.h1}>
            Engineered for <span className="gradientText">impact</span>.
          </h1>
          <p className={styles.lead}>
            We design and build premium software that drives growth, streamlines
            operations, and delivers crystalline user experiences — end to end.
          </p>
        </div>
      </section>

      <div className="container">
        <div className={styles.list}>
          {services.map((service) => (
            <article key={service.title} className={styles.card}>
              <div className={styles.cardGrid}>
                <div>
                  <div className={styles.cardHead}>
                    <IconBadge name={service.icon} size={52} iconSize={27} />
                    <h2 className={styles.cardTitle}>{service.title}</h2>
                  </div>
                  <h3 className={styles.tagline}>{service.tagline}</h3>
                  <div className={styles.blocks}>
                    <div>
                      <div className={styles.blockLabel}>The problem</div>
                      <p className={styles.blockText}>{service.problem}</p>
                    </div>
                    <div>
                      <div className={styles.blockLabel}>The solution</div>
                      <p className={styles.blockText}>{service.solution}</p>
                    </div>
                  </div>
                  <div className={styles.startBtn}>
                    <Button href="/contact" variant="accent" size="sm" icon="arrow_forward">
                      Start your project
                    </Button>
                  </div>
                </div>

                <div className={styles.panel}>
                  <div className={styles.panelGrid}>
                    <div>
                      <div className={styles.blockLabel}>Deliverables</div>
                      <div className={styles.deliverables}>
                        {service.deliverables.map((item) => (
                          <div key={item} className={styles.deliverable}>
                            <Icon
                              name="check_circle"
                              size={18}
                              className={styles.deliverableIcon}
                            />
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className={styles.blockLabel}>Tech stack</div>
                      <p className={styles.stack}>{service.stack}</p>
                      <div className={styles.panelDivider} />
                      <div className={styles.blockLabel}>Timeline</div>
                      <p className={styles.timeline}>{service.timeline}</p>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      <CtaSection
        variant="dark"
        title="Not sure where to start?"
        text="Book a call and we'll help you scope the right engagement for your goals."
        action={{ label: "Book a call", href: "/contact", icon: "arrow_outward" }}
      />
    </>
  );
}
