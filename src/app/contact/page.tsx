import { Reveal } from "@/components/motion/Reveal";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Icon } from "@/components/ui/Icon";
import { IconBadge } from "@/components/ui/IconBadge";
import { contactChannels } from "@/content/contact";
import { siteConfig } from "@/lib/site";
import type { Metadata } from "next";
import { ContactForm } from "./ContactForm";
import styles from "./contact.module.css";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Tell Vezvora about your vision and our team will get back to you with actionable insights — usually within 12 hours.",
};

export default function ContactPage() {
  return (
    <div className="container">
      <section className={styles.hero}>
        <Stagger mode="mount" stagger={0.1} delay={0.1}>
          <StaggerItem>
            <Eyebrow>Contact</Eyebrow>
          </StaggerItem>
          <StaggerItem duration={0.7}>
            <h1 className={styles.h1}>
              Let&apos;s build something{" "}
              <span className="gradientText">exceptional</span> together.
            </h1>
          </StaggerItem>
          <StaggerItem>
            <p className={styles.lead}>
              Tell us about your vision and our team will get back to you with
              actionable insights — usually within 12 hours.
            </p>
          </StaggerItem>
        </Stagger>
      </section>

      <section className={styles.grid}>
        <Reveal mode="mount" delay={0.3}>
          <ContactForm />
        </Reveal>

        <Stagger
          mode="mount"
          stagger={0.12}
          delay={0.4}
          className={styles.side}
        >
          <StaggerItem className={styles.sideCard}>
            <h2 className={styles.sideTitle}>Get in touch</h2>
            <div className={styles.channels}>
              {contactChannels.map((channel) => (
                <div key={channel.label} className={styles.channel}>
                  <IconBadge
                    name={channel.icon}
                    size={42}
                    iconSize={21}
                    radius={11}
                  />
                  <div>
                    <div className={styles.channelLabel}>{channel.label}</div>
                    <div className={styles.channelValue}>{channel.value}</div>
                  </div>
                </div>
              ))}
            </div>
            <a
              href={siteConfig.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.whatsappLink}
              aria-label={`Chat with Vezvora on WhatsApp at ${siteConfig.phone}`}
            >
              <Icon name="call" size={19} />
              <span>
                Chat on WhatsApp
                <small>{siteConfig.phone}</small>
              </span>
            </a>
          </StaggerItem>

          <StaggerItem className={styles.responseCard}>
            <span className={styles.responseIcon}>
              <Icon name="schedule" size={21} />
            </span>
            <div>
              <div className={styles.responseLabel}>Response time</div>
              <div className={styles.responseText}>
                We respond within 12 hours.
              </div>
            </div>
          </StaggerItem>
        </Stagger>
      </section>
    </div>
  );
}
