import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Icon } from "@/components/ui/Icon";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import styles from "../intimate-hygiene/page.module.css";

export const metadata: Metadata = {
  title: "Techni case study",
  description:
    "How Vezvora built a connected mobile workflow for Techni service professionals.",
};

const outcomes = [
  {
    value: "1",
    label: "connected worker workflow",
  },
  {
    value: "2",
    label: "integrated mobile and backend applications",
  },
  {
    value: "OTP",
    label: "phone-based authentication flow",
  },
];

const capabilities = [
  "Phone-OTP authentication and guided worker onboarding, including profile, category, identity-image, and document collection flows.",
  "A worker home experience for reviewing new requests and scheduled jobs, accepting or declining work, and following job status changes.",
  "Job details with customer contact information, issue photography, turn-by-turn route support, and completion confirmation.",
  "Earnings views, profile management, notification support, and secured worker API integration backed by Firebase identity tokens.",
];

const technology = [
  "Flutter",
  "Dart",
  "Firebase Authentication",
  "Cloud Firestore",
  "Firebase Storage",
  "Firebase Cloud Messaging",
  "Node.js",
  "Express",
  "Google Maps",
];

export default function TechniCaseStudyPage() {
  return (
    <main>
      <section className={styles.hero}>
        <div className={`container ${styles.heroInner}`}>
          <Link href="/work" className={styles.backLink}>
            <Icon name="arrow_upward" size={16} />
            Back to work
          </Link>
          <div className={styles.heroGrid}>
            <div>
              <Eyebrow>Case study · Field-service marketplace</Eyebrow>
              <h1 className={styles.title}>
                Making every service call easier to <span className="gradientText">accept, reach, and complete.</span>
              </h1>
              <p className={styles.lead}>
                Techni gives service professionals a single mobile workspace for
                onboarding, incoming jobs, customer navigation, job progress,
                and earnings—supported by a secure backend and real-time
                Firebase services.
              </p>
              <Button href="/contact" variant="accent" icon="arrow_forward">
                Start a project
              </Button>
            </div>
            <div className={styles.logoPanel}>
              <Image
                src="/techni.png"
                alt="Techni logo"
                width={512}
                height={512}
                priority
                className={styles.logo}
              />
            </div>
          </div>
        </div>
      </section>

      <section className={styles.outcomes} aria-label="Project outcomes">
        <div className={`container ${styles.outcomesGrid}`}>
          {outcomes.map((outcome) => (
            <div key={outcome.label} className={styles.outcome}>
              <strong>{outcome.value}</strong>
              <span>{outcome.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className={`container ${styles.content}`}>
        <div className={styles.introGrid}>
          <div>
            <Eyebrow>The challenge</Eyebrow>
            <h2>Field professionals need more than a queue of job requests.</h2>
          </div>
          <p>
            From verification to arriving on site and recording a completed
            job, workers need a clear workflow that keeps customer details,
            location, status, and earnings within reach. Techni connects those
            moments without asking workers to jump between tools.
          </p>
        </div>

        <div className={styles.solution}>
          <Eyebrow>The solution</Eyebrow>
          <h2>A mobile workday built around the people delivering the service.</h2>
          <div className={styles.capabilityGrid}>
            {capabilities.map((capability, index) => (
              <article key={capability} className={styles.capability}>
                <span className={styles.capabilityNumber}>0{index + 1}</span>
                <p>{capability}</p>
              </article>
            ))}
          </div>
        </div>

        <section className={styles.stackSection}>
          <Eyebrow>Tech stack</Eyebrow>
          <h2>Built for reliable mobile work and secure, connected operations.</h2>
          <div className={styles.techList}>
            {technology.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
          <div className={styles.stackLogo}>
            <span>Built for</span>
            <Image
              src="/techni.png"
              alt="Techni logo"
              width={512}
              height={512}
              className={styles.stackLogoImage}
            />
          </div>
        </section>
      </section>
    </main>
  );
}