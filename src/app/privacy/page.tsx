import type { Metadata } from "next";
import { Reveal } from "@/components/motion/Reveal";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { privacy } from "@/content/privacy";
import styles from "../terms/terms.module.css";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Vezvora collects, uses, protects, and retains information shared through the website and project inquiry process.",
};

export default function PrivacyPage() {
  return (
    <main className={`container ${styles.wrap}`}>
      <Reveal mode="mount">
        <section className={styles.hero}>
          <Eyebrow>Privacy</Eyebrow>
          <h1 className={styles.h1}>Privacy Policy</h1>
          <p className={styles.lead}>{privacy.intro}</p>
          <p className={styles.updated}>Last updated: {privacy.updated}</p>
        </section>
      </Reveal>

      <div className={styles.content}>
        {privacy.sections.map((section) => (
          <Reveal key={section.title}>
            <section className={styles.section}>
              <h2>{section.title}</h2>
              {section.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </section>
          </Reveal>
        ))}
      </div>
    </main>
  );
}
