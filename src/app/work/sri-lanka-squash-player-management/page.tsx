import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Icon } from "@/components/ui/Icon";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import styles from "../intimate-hygiene/page.module.css";

export const metadata: Metadata = {
  title: "Sri Lanka Squash Player Management System case study",
  description:
    "How Vezvora built a role-based training, performance, and player-management system for the Sri Lanka Squash community.",
};

const outcomes = [
  {
    value: "2",
    label: "connected player and coach workspaces",
  },
  {
    value: "6",
    label: "core performance and wellbeing areas",
  },
  {
    value: "1",
    label: "shared source of truth for player development",
  },
];

const capabilities = [
  "Role-based player and coach dashboards that put training volume, schedules, recovery, rankings, and goals in context.",
  "Structured training logs, match results, personal bests, and performance visualisations to make progress easy to review.",
  "Workload monitoring with Acute:Chronic Workload Ratio alerts, plus injury logging and an AI injury-prevention advisor.",
  "Coach tools for player oversight, interactive court playbooks, scheduling, and video-based movement heatmaps.",
];

const technology = [
  "React",
  "Vite",
  "Firebase Authentication",
  "Cloud Firestore",
  "Firebase Storage",
  "Google Gemini AI",
  "Recharts",
];

export default function SriLankaSquashPlayerManagementCaseStudyPage() {
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
              <Eyebrow>Case study · Athlete management</Eyebrow>
              <h1 className={styles.title}>
                Giving Sri Lanka&apos;s squash players a{" "}
                <span className="gradientText">smarter way to progress.</span>
              </h1>
              <p className={styles.lead}>
                The Sri Lanka Squash Player Management System brings coaching,
                performance tracking, training plans, and injury prevention into
                one secure platform for players affiliated with Sri Lanka Squash
                and the coaches supporting them.
              </p>
              <Button href="/contact" variant="accent" icon="arrow_forward">
                Start a project
              </Button>
            </div>
            <div className={styles.logoPanel}>
              <Image
                src="/SL_SQUASH.jpeg"
                alt="Sri Lanka Squash logo"
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
            <h2>
              Player development needs a connected view of the whole athlete.
            </h2>
          </div>
          <p>
            Players and coaches need to balance sessions, competition, fitness,
            recovery, and injury risk without losing the context behind the
            data. The platform needed to turn those moving parts into clear,
            practical actions for both sides of the coach-player relationship.
          </p>
        </div>

        <div className={styles.solution}>
          <Eyebrow>The solution</Eyebrow>
          <h2>
            A dedicated digital training environment for the squash community.
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
          <h2>
            Built for secure collaboration, real-time data, and informed
            decisions.
          </h2>
          <div className={styles.techList}>
            {technology.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
          <div className={styles.stackLogo}>
            <span>Built for</span>
            <Image
              src="/SL_SQUASH.jpeg"
              alt="Sri Lanka Squash logo"
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
