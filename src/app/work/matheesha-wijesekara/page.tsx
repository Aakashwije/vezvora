import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Icon } from "@/components/ui/Icon";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import styles from "../intimate-hygiene/page.module.css";

export const metadata: Metadata = {
  title: "Matheesha Wijesekara case study",
  description:
    "How Vezvora built a cinematic, content-managed portfolio for Sri Lankan squash athlete Matheesha Wijesekara.",
};

const outcomes = [
  {
    value: "#1",
    label: "Sri Lankan U19 ranking showcased",
  },
  {
    value: "#7",
    label: "Asian U19 ranking highlighted",
  },
  {
    value: "8",
    label: "content areas managed in one dashboard",
  },
];

const capabilities = [
  "A high-impact athlete profile that brings rankings, achievements, sponsors, and media into a single digital presence.",
  "Interactive galleries, podium highlights, and video showcases that make tournament moments easy to explore.",
  "Tiered sponsorship packages and partnership storytelling designed for brands, media organisations, and event organisers.",
  "A built-in admin dashboard for content and asset updates, with Supabase storage and a local fallback for resilient publishing.",
];

const technology = [
  "Next.js 16",
  "TypeScript",
  "Tailwind CSS 4",
  "Framer Motion",
  "Supabase",
  "Vercel",
];

export default function MatheeshaWijesekaraCaseStudyPage() {
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
              <Eyebrow>Case study · Athlete portfolio</Eyebrow>
              <h1 className={styles.title}>
                An athlete&apos;s performance, elevated by a{" "}
                <span className="gradientText">digital stage.</span>
              </h1>
              <p className={styles.lead}>
                Matheesha Wijesekara needed a memorable presence for sponsors,
                media, tournament organisers, and fans. We built a cinematic
                platform that turns a growing squash career into an evolving
                story of performance and ambition.
              </p>
              <Button href="/contact" variant="accent" icon="arrow_forward">
                Start a project
              </Button>
            </div>
            <div className={styles.logoPanel}>
              <Image
                src="/matheesha_logo.png"
                alt="Matheesha Wijesekara logo"
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
              Rising athletes need a platform that moves as quickly as their
              careers.
            </h2>
          </div>
          <p>
            Matheesha&apos;s rankings, tournament results, media features, and
            partnership opportunities needed more than a static profile. The
            platform had to feel aspirational while allowing content to be
            updated quickly as new achievements arrived.
          </p>
        </div>

        <div className={styles.solution}>
          <Eyebrow>The solution</Eyebrow>
          <h2>
            A cinematic portfolio built to celebrate progress and create
            opportunity.
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
            Built for motion, performance, and content that stays current.
          </h2>
          <div className={styles.techList}>
            {technology.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
          <div className={styles.stackLogo}>
            <span>Built for</span>
            <Image
              src="/matheesha_logo.png"
              alt="Matheesha Wijesekara logo"
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
