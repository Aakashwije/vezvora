import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Icon } from "@/components/ui/Icon";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import styles from "../intimate-hygiene/page.module.css";

export const metadata: Metadata = {
  title: "UD Travels case study",
  description:
    "How Vezvora built UD Travels' modern transport and tourism platform.",
};

const outcomes = [
  {
    value: "50+",
    label: "happy clients represented",
  },
  {
    value: "100+",
    label: "fleet vehicles showcased",
  },
  {
    value: "25+",
    label: "destinations highlighted",
  },
];

const capabilities = [
  "Clear service journeys for local hire, corporate transport, and Sri Lankan tourism.",
  "A detailed fleet explorer covering cars, vans, and buses with capacity and comfort information.",
  "A responsive contact flow with service selection, enquiry validation, and direct location details.",
  "A polished brand experience that keeps safety, reliability, and memorable journeys at the centre.",
];

const technology = [
  "Next.js",
  "React",
  "CSS Modules",
  "Server Actions",
  "Next Image",
  "Lucide React",
];

export default function UDTravelsCaseStudyPage() {
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
              <Eyebrow>Case study · Transport & tourism</Eyebrow>
              <h1 className={styles.title}>
                Every journey starts with a{" "}
                <span className="gradientText">better digital experience.</span>
              </h1>
              <p className={styles.lead}>
                UD Travels needed a trustworthy online platform that connects
                people with local hire, corporate transport, tourism services,
                and a fleet built for every kind of Sri Lankan journey.
              </p>
              <Button href="/contact" variant="accent" icon="arrow_forward">
                Start a project
              </Button>
            </div>
            <div className={styles.logoPanel}>
              <Image
                src="/ud.png"
                alt="UD Travels logo"
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
              Transport services needed an easier way to become the journey of
              choice.
            </h2>
          </div>
          <p>
            UD Travels needed to present a broad service offering without making
            customers work to find the right vehicle, travel option, or contact
            route. The platform had to feel professional, responsive, and clear
            for both local and tourism customers.
          </p>
        </div>

        <div className={styles.solution}>
          <Eyebrow>The solution</Eyebrow>
          <h2>
            A travel platform that turns practical details into confidence to
            book.
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
          <h2>Built for responsive browsing and straightforward enquiries.</h2>
          <div className={styles.techList}>
            {technology.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
          <div className={styles.stackLogo}>
            <span>Built for</span>
            <Image
              src="/ud.png"
              alt="UD Travels logo"
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
