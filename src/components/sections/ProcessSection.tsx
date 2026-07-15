"use client";

import { useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
  useSpring,
} from "motion/react";
import type { ProcessStep } from "@/content/home";
import { EASE } from "@/lib/animations";
import { cx } from "@/lib/cx";
import { Eyebrow } from "@/components/ui/Eyebrow";
import styles from "./ProcessSection.module.css";

type ProcessSectionProps = {
  steps: ProcessStep[];
};

/**
 * "How we work" — sticky split layout with a scroll-linked timeline.
 * The left heading stays pinned while the steps scroll by on the right;
 * a gradient rail fills with scroll progress and activates each step in
 * turn. On mobile the layout degrades to a vertical timeline with
 * in-view reveals.
 */
export function ProcessSection({ steps }: ProcessSectionProps) {
  const listRef = useRef<HTMLOListElement>(null);
  const [active, setActive] = useState(0);

  // Progress runs from when the list enters the lower viewport until its
  // end crosses the midpoint — so the last step activates before leaving.
  const { scrollYProgress } = useScroll({
    target: listRef,
    offset: ["start 0.72", "end 0.42"],
  });
  const railProgress = useSpring(scrollYProgress, {
    stiffness: 110,
    damping: 26,
    mass: 0.5,
  });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const next = Math.min(steps.length - 1, Math.floor(v * steps.length));
    setActive(Math.max(0, next));
  });

  return (
    <section className={styles.process}>
      <div className={`container ${styles.grid}`}>
        {/* Pinned intro (static on mobile) */}
        <div className={styles.stickyCol}>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <Eyebrow>How we work</Eyebrow>
            <h2 className={styles.title}>
              A process engineered for{" "}
              <span className="gradientText">momentum</span>.
            </h2>
            <p className={styles.intro}>
              Four tight phases, one continuous feedback loop — from first
              conversation to a platform that scales.
            </p>
          </motion.div>

          <div className={styles.counter} aria-hidden>
            <span className={styles.counterCurrent}>
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={active}
                  className={cx("gradientText", styles.counterDigit)}
                  initial={{ y: "0.7em", opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: "-0.7em", opacity: 0 }}
                  transition={{ duration: 0.35, ease: EASE }}
                >
                  {String(active + 1).padStart(2, "0")}
                </motion.span>
              </AnimatePresence>
            </span>
            <span className={styles.counterTotal}>
              / {String(steps.length).padStart(2, "0")}
            </span>
          </div>
        </div>

        {/* Timeline */}
        <ol ref={listRef} className={styles.steps}>
          <span className={styles.rail} aria-hidden>
            <motion.span
              className={styles.railFill}
              style={{ scaleY: railProgress }}
            />
          </span>

          {steps.map((step, i) => (
            <motion.li
              key={step.num}
              className={cx(styles.card, i <= active && styles.cardActive)}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.65, ease: EASE, delay: i * 0.05 }}
              whileHover={{ y: -5 }}
            >
              <span className={styles.dot} aria-hidden />
              <div className={styles.cardInner}>
                <span className={styles.num}>{step.num}</span>
                <div>
                  <h3 className={styles.stepTitle}>{step.title}</h3>
                  <p className={styles.stepDesc}>{step.desc}</p>
                </div>
              </div>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}
