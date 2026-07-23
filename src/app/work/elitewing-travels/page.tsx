import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Icon } from "@/components/ui/Icon";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import styles from "../intimate-hygiene/page.module.css";

export const metadata: Metadata = {
  title: "EliteWing Travels case study",
  description:
    "How Vezvora built EliteWing Travels' premium Sri Lankan travel and tourism platform.",
};

const outcomes = [
  {
    value: "10k+",
    label: "happy travellers served",
  },
  {
    value: "500+",
    label: "tours completed annually",
  },
  {
    value: "21",
    label: "years of travel excellence",
  },
];

const capabilities = [
  "Curated tour packages with itinerary details, highlights, galleries, and personalised enquiry paths.",
  "Interactive Sri Lankan destination discovery across cultural, coastal, wildlife, and adventure travel.",
  "A luxury fleet showcase covering private cars, vans, and coaches for every style of journey.",
  "Responsive, animated storytelling designed to turn travel inspiration into confident enquiries.",
];

const technology = [
  "Next.js",
  "TypeScript",
  "Tailwind CSS",
  "Framer Motion",
  "React Hook Form",
  "Zod",
];

export default function EliteWingTravelsCaseStudyPage() {
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
              <Eyebrow>Case study · Luxury travel</Eyebrow>
              <h1 className={styles.title}>
                Sri Lankan journeys, designed to{" "}
                <span className="gradientText">inspire.</span>
              </h1>
              <p className={styles.lead}>
                EliteWing Travels needed a digital experience worthy of its
                premium private tours, curated destinations, and luxury fleet.
                We created a clear path from discovery to a tailored journey.
              </p>
              <Button href="/contact" variant="accent" icon="arrow_forward">
                Start a project
              </Button>
            </div>
            <div className={styles.logoPanel}>
              <Image
                src="/elitewing.jpg"
                alt="EliteWing Travels logo"
                width={640}
                height={360}
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
              Premium travel deserves a discovery experience with the same care.
            </h2>
          </div>
          <p>
            EliteWing&apos;s digital presence needed to make the richness of Sri
            Lanka easy to explore while presenting its private tours, quality
            fleet, and authentic hospitality with the confidence expected of a
            long-established travel provider.
          </p>
        </div>

        <div className={styles.solution}>
          <Eyebrow>The solution</Eyebrow>
          <h2>
            A luxury travel platform that guides each visitor toward their ideal
            journey.
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
          <h2>Built for a rich, responsive travel experience.</h2>
          <div className={styles.techList}>
            {technology.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
          <div className={styles.stackLogo}>
            <span>Built for</span>
            <Image
              src="/elitewing.jpg"
              alt="EliteWing Travels logo"
              width={640}
              height={360}
              className={styles.stackLogoImage}
            />
          </div>
        </section>
      </section>
    </main>
  );
}
