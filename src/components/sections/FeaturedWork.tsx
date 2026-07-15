"use client";

import { useCallback, useState } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "motion/react";
import { Button } from "@/components/ui/Button";
import { CountUp } from "@/components/motion/CountUp";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { LiveMetric } from "@/components/motion/LiveMetric";
import { Reveal } from "@/components/motion/Reveal";
import styles from "./FeaturedWork.module.css";

const bars = [40, 62, 52, 80, 68, 94].map((h, i) => ({
  h,
  fill:
    i === 3
      ? "linear-gradient(180deg,#9fce22,#3bb85e)"
      : i === 5
        ? "linear-gradient(180deg,#8ec21a,#2fd3c4)"
        : "#dfeed6",
}));

const stats = [
  { value: "71%", label: "Faster loads", color: "#a9e022" },
  { value: "2.4M", label: "Daily events", color: "#3bd6c0" },
  { value: "$4.1M", label: "New ARR", color: "#63d17f" },
];

/** Max card tilt, degrees. */
const TILT = 3.2;

const formatThroughput = (v: number) => `${v.toFixed(1)}k/s`;
const formatLatency = (v: number) => `${Math.round(v)}ms`;

/**
 * "Featured work" — dark case-study band with cursor-tracked 3D tilt.
 * The dashboard mock sits on its own depth layer (translateZ) and pops
 * forward on hover; a cursor-following radial glow lights the band, the
 * chart bars spring up on scroll, and the dashboard metrics stream like
 * a live feed while hovered.
 */
export function FeaturedWork() {
  const reduceMotion = useReducedMotion();
  const [hovered, setHovered] = useState(false);

  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const rotateX = useSpring(rx, { stiffness: 150, damping: 22, mass: 0.8 });
  const rotateY = useSpring(ry, { stiffness: 150, damping: 22, mass: 0.8 });

  // Cursor glow position (% of band), springed so the glow trails the mouse.
  const gx = useMotionValue(78);
  const gy = useMotionValue(12);
  const glowX = useSpring(gx, { stiffness: 55, damping: 18 });
  const glowY = useSpring(gy, { stiffness: 55, damping: 18 });
  const glow = useMotionTemplate`radial-gradient(480px circle at ${glowX}% ${glowY}%, rgba(47, 211, 196, 0.26), rgba(40, 184, 95, 0.11) 45%, transparent 72%)`;

  const onMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      gx.set(px * 100);
      gy.set(py * 100);
      if (reduceMotion) return;
      ry.set((px - 0.5) * 2 * TILT);
      rx.set((0.5 - py) * 2 * TILT);
    },
    [gx, gy, rx, ry, reduceMotion],
  );

  const onLeave = useCallback(() => {
    setHovered(false);
    rx.set(0);
    ry.set(0);
    gx.set(78);
    gy.set(12);
  }, [gx, gy, rx, ry]);

  return (
    <section className={styles.featured}>
      <div className="container">
        {/* Reveal doubles as the perspective root for the 3D tilt */}
        <Reveal duration={0.7} className={styles.perspective}>
          <motion.div
            className={styles.band}
            style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
            onMouseMove={onMove}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={onLeave}
          >
            {/* Clipped glow layers (the band itself must not clip, or the
                3D depth of the mock would be flattened) */}
            <div className={styles.clip} aria-hidden>
              <div className={styles.blob} />
              <motion.div
                className={styles.cursorGlow}
                style={{ background: glow }}
                animate={{ opacity: hovered ? 1 : 0 }}
                transition={{ duration: 0.45 }}
              />
            </div>

            <div className={styles.grid}>
              <div className={styles.copy}>
                <Eyebrow tone="light">Featured work</Eyebrow>
                <h2 className={styles.title}>
                  A logistics platform rebuilt for{" "}
                  <span className="gradientText">10× scale</span>.
                </h2>
                <p className={styles.text}>
                  We re-architected a legacy operations suite into a real-time
                  platform handling millions of daily events — cutting load
                  times by 71% and unlocking a new revenue line.
                </p>
                <div className={styles.stats}>
                  {stats.map((stat) => (
                    <div key={stat.label} className={styles.stat}>
                      <div
                        className={styles.statValue}
                        style={{ color: stat.color }}
                      >
                        <CountUp value={stat.value} />
                      </div>
                      <div className={styles.statLabel}>{stat.label}</div>
                    </div>
                  ))}
                </div>
                <Button
                  href="/work"
                  variant="accent"
                  icon="arrow_forward"
                  className={styles.cta}
                >
                  Read the case study
                </Button>
              </div>

              {/* Dashboard mock — separate 3D depth layer */}
              <div className={styles.mockWrap}>
                <motion.div
                  className={styles.mock}
                  animate={
                    reduceMotion
                      ? undefined
                      : { z: hovered ? 52 : 18, scale: hovered ? 1.02 : 1 }
                  }
                  transition={{ type: "spring", stiffness: 180, damping: 21 }}
                >
                  <div className={styles.fmHead}>
                    <span className={styles.fmTitle}>Operations</span>
                    <span className={styles.fmLive}>
                      <span className={styles.fmLiveDot} />
                      Live
                    </span>
                  </div>
                  <div className={styles.fmGrid}>
                    <div className={styles.fmCell}>
                      <div className={styles.fmCellLabel}>Throughput</div>
                      <LiveMetric
                        base={28.4}
                        jitter={0.8}
                        format={formatThroughput}
                        active={hovered && !reduceMotion}
                        className={styles.fmCellValue}
                      />
                    </div>
                    <div className={styles.fmCell}>
                      <div className={styles.fmCellLabel}>Latency</div>
                      <LiveMetric
                        base={42}
                        jitter={4}
                        format={formatLatency}
                        active={hovered && !reduceMotion}
                        className={styles.fmCellValue}
                      />
                    </div>
                  </div>
                  <div className={styles.fmChartWrap}>
                    <div className={styles.fmChart}>
                      {bars.map((bar, i) => (
                        <motion.span
                          key={i}
                          className={styles.fmBar}
                          style={{
                            height: `${bar.h}%`,
                            background: bar.fill,
                            transformOrigin: "bottom",
                          }}
                          initial={{ scaleY: 0 }}
                          whileInView={{ scaleY: 1 }}
                          viewport={{ once: true, amount: 0.4 }}
                          transition={{
                            type: "spring",
                            stiffness: 170,
                            damping: 13,
                            mass: 0.9,
                            delay: 0.2 + i * 0.09,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </Reveal>
      </div>
    </section>
  );
}
