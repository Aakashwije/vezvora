import type { Metadata } from "next";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { WorkGallery } from "./WorkGallery";
import styles from "./work.module.css";

export const metadata: Metadata = {
  title: "Work",
  description:
    "Selected work from Vezvora — products we've shipped across mobile, web, POS, and enterprise platforms for high-growth teams.",
};

export default function WorkPage() {
  return (
    <div className="container">
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <Eyebrow>Selected work</Eyebrow>
          <h1 className={styles.h1}>
            Products that <span className="gradientText">ship and scale</span>.
          </h1>
          <p className={styles.lead}>
            Engineering excellence delivered across mobile, web, and enterprise
            platforms. A look at products we&apos;ve built for high-growth teams.
          </p>
        </div>
      </section>

      <WorkGallery />
    </div>
  );
}
