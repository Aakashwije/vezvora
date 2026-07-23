import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Icon } from "@/components/ui/Icon";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Intimate Hygiene case study",
  description:
    "How Vezvora built Intimate Hygiene's full-stack commerce and operations platform.",
};

const outcomes = [
  {
    value: "100+",
    label: "orders processed daily",
  },
  {
    value: "3",
    label: "languages supported across the storefront",
  },
  {
    value: "24/7",
    label: "visibility across orders and operations",
  },
];

const capabilities = [
  "Product catalog and bundles designed for retail, travel, and B2B customers.",
  "Cash-on-delivery forms and pre-filled WhatsApp checkout for flexible ordering.",
  "Customer accounts, order tracking, and a guided product-finder quiz.",
  "A real-time admin console for orders, enquiries, analytics, customers, and inventory.",
];

const technology = [
  "React 19",
  "Vite 8",
  "Tailwind CSS 4",
  "Supabase",
  "Vercel Functions",
  "Resend",
];

export default function IntimateHygieneCaseStudyPage() {
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
              <Eyebrow>Case study · E-commerce</Eyebrow>
              <h1 className={styles.title}>
                A connected commerce platform for{" "}
                <span className="gradientText">Intimate Hygiene</span>.
              </h1>
              <p className={styles.lead}>
                From a WhatsApp-first storefront to a complete digital commerce
                operation for premium, eco-friendly disposable toilet seat
                covers.
              </p>
              <Button href="/contact" variant="accent" icon="arrow_forward">
                Start a project
              </Button>
            </div>
            <div className={styles.logoPanel}>
              <Image
                src="/Intimate.png"
                alt="Intimate Hygiene Enterprises logo"
                width={504}
                height={150}
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
              A growing product business needed a system that could grow with
              it.
            </h2>
          </div>
          <p>
            Intimate Hygiene needed to move beyond a client-only WhatsApp
            storefront while preserving the frictionless ordering experience its
            customers valued. The new product had to serve personal, travel, and
            enterprise buyers while giving the team a reliable operational view.
          </p>
        </div>

        <div className={styles.solution}>
          <Eyebrow>The solution</Eyebrow>
          <h2>
            One storefront, one source of truth, and multiple ways to buy.
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
          <h2>Built with a modern, operationally resilient stack.</h2>
          <div className={styles.techList}>
            {technology.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
          <div className={styles.stackLogo}>
            <span>Built for</span>
            <Image
              src="/Intimate.png"
              alt="Intimate Hygiene Enterprises logo"
              width={504}
              height={150}
              className={styles.stackLogoImage}
            />
          </div>
        </section>
      </section>
    </main>
  );
}
