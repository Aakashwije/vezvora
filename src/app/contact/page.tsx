import type { Metadata } from "next";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Icon } from "@/components/ui/Icon";
import { IconBadge } from "@/components/ui/IconBadge";
import { contactChannels } from "@/content/contact";
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
        <Eyebrow>Contact</Eyebrow>
        <h1 className={styles.h1}>
          Let&apos;s build something{" "}
          <span className="gradientText">exceptional</span> together.
        </h1>
        <p className={styles.lead}>
          Tell us about your vision and our team will get back to you with
          actionable insights — usually within 12 hours.
        </p>
      </section>

      <section className={styles.grid}>
        <ContactForm />

        <aside className={styles.side}>
          <div className={styles.sideCard}>
            <h2 className={styles.sideTitle}>Get in touch</h2>
            <div className={styles.channels}>
              {contactChannels.map((channel) => (
                <div key={channel.label} className={styles.channel}>
                  <IconBadge name={channel.icon} size={42} iconSize={21} radius={11} />
                  <div>
                    <div className={styles.channelLabel}>{channel.label}</div>
                    <div className={styles.channelValue}>{channel.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.responseCard}>
            <span className={styles.responseIcon}>
              <Icon name="schedule" size={21} />
            </span>
            <div>
              <div className={styles.responseLabel}>Response time</div>
              <div className={styles.responseText}>We respond within 12 hours.</div>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
