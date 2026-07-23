import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Icon } from "@/components/ui/Icon";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import styles from "../intimate-hygiene/page.module.css";

export const metadata: Metadata = {
  title: "ProcuraX case study",
  description:
    "How Vezvora built ProcuraX, an intelligent procurement and construction management platform for ICC.",
};

const outcomes = [
  {
    value: "9",
    label: "connected operational capabilities",
  },
  {
    value: "6",
    label: "role levels managed with RBAC",
  },
  {
    value: "345+",
    label: "automated tests across the platform",
  },
];

const capabilities = [
  "Live project dashboards with procurement status, KPIs, and activity feeds.",
  "Digital procurement schedules with CSV imports, material delivery tracking, and automated delay alerts.",
  "Task, site-note, document, and smart-meeting workflows with conflict detection and location-aware reminders.",
  "Real-time communication, secure role-based access, notifications, and BuildAssist AI guidance for site teams.",
];

const technology = [
  "Flutter",
  "Node.js 22",
  "Express 5",
  "MongoDB Atlas",
  "Redis",
  "Firebase",
  "Cloudinary",
  "Railway",
];

export default function ProcuraXCaseStudyPage() {
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
              <Eyebrow>Case study · Construction management</Eyebrow>
              <h1 className={styles.title}>
                Procurement and construction operations,{" "}
                <span className="gradientText">connected.</span>
              </h1>
              <p className={styles.lead}>
                ProcuraX gives International Construction Consortium teams one
                mobile platform to coordinate procurement, projects, meetings,
                site communication, and the work that keeps them moving.
              </p>
              <Button href="/contact" variant="accent" icon="arrow_forward">
                Start a project
              </Button>
            </div>
            <div className={styles.logoPanel}>
              <Image
                src="/ICC.jpeg"
                alt="International Construction Consortium logo"
                width={400}
                height={400}
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
            <h2>
              Construction teams needed a shared, real-time view of the work.
            </h2>
          </div>
          <p>
            Procurement, task coordination, meetings, files, and team
            communication were spread across disconnected processes. ICC needed
            a secure system that could put current project information in the
            hands of every team member, wherever they were working.
          </p>
        </div>

        <div className={styles.solution}>
          <Eyebrow>The solution</Eyebrow>
          <h2>
            A field-ready operating system for construction project delivery.
          </h2>
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
          <h2>Built for secure, responsive operations in the field.</h2>
          <div className={styles.techList}>
            {technology.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
          <div className={styles.stackLogo}>
            <span>Built for</span>
            <Image
              src="/ICC.jpeg"
              alt="International Construction Consortium logo"
              width={400}
              height={400}
              className={styles.stackLogoImage}
            />
          </div>
        </section>
      </section>
    </main>
  );
}
