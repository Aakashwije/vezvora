"use client";

import { useCallback, useState } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "motion/react";
import { CountUp } from "@/components/motion/CountUp";
import { LiquidWobble } from "@/components/motion/LiquidWobble";
import { Reveal } from "@/components/motion/Reveal";
import { Icon } from "@/components/ui/Icon";
import styles from "./HeroMock.module.css";

const bars = [
  { h: 42, fill: "#eff3ec" },
  { h: 58, fill: "#e7f0e3" },
  { h: 50, fill: "#eff3ec" },
  { h: 73, fill: "linear-gradient(180deg,#9fce22,#3bb85e)" },
  { h: 64, fill: "#e7f0e3" },
  { h: 88, fill: "linear-gradient(180deg,#8ec21a,#28b85f 55%,#2fd3c4)" },
  { h: 70, fill: "#e7f0e3" },
];

/** Max card tilt, degrees. */
const TILT = 3;

/**
 * Hero dashboard mock. Keeps the LiquidWobble scroll effect, and layers
 * on a cursor-tracked 3D tilt with hover pop, a cursor-following green
 * glow, spring-rising chart bars, and a count-up KPI.
 */
export function HeroMock({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion();
  const [hovered, setHovered] = useState(false);

  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const rotateX = useSpring(rx, { stiffness: 150, damping: 22, mass: 0.8 });
  const rotateY = useSpring(ry, { stiffness: 150, damping: 22, mass: 0.8 });

  // Cursor glow position (% of card), springed so the glow trails the mouse.
  const gx = useMotionValue(50);
  const gy = useMotionValue(30);
  const glowX = useSpring(gx, { stiffness: 55, damping: 18 });
  const glowY = useSpring(gy, { stiffness: 55, damping: 18 });
  const glow = useMotionTemplate`radial-gradient(340px circle at ${glowX}% ${glowY}%, rgba(40, 184, 95, 0.09), rgba(47, 211, 196, 0.04) 45%, transparent 72%)`;

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
    gx.set(50);
    gy.set(30);
  }, [gx, gy, rx, ry]);

  return (
    <Reveal
      mode="mount"
      delay={0.45}
      duration={0.8}
      className={`${styles.perspective} ${className ?? ""}`}
    >
      <motion.div
        style={{ rotateX, rotateY }}
        animate={reduceMotion ? undefined : { z: hovered ? 26 : 0, scale: hovered ? 1.012 : 1 }}
        transition={{ type: "spring", stiffness: 180, damping: 21 }}
        onMouseMove={onMove}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={onLeave}
      >
        <LiquidWobble>
          <div className={styles.mockCard}>
            <motion.div
              className={styles.cursorGlow}
              style={{ background: glow }}
              animate={{ opacity: hovered ? 1 : 0 }}
              transition={{ duration: 0.45 }}
              aria-hidden
            />
            <div className={styles.mockTop}>
              <div className={styles.dots}>
                <span className={styles.dot} />
                <span className={styles.dot} />
                <span className={styles.dot} />
              </div>
              <span className={styles.mockUrl}>www.vezvora.com</span>
            </div>
            <div className={styles.mockBody}>
              <div className={styles.mockHead}>
                <div>
                  <div className={styles.mockKpiLabel}>Monthly growth</div>
                  <div className={styles.mockKpiValue}>
                    <CountUp value="+124.8%" />
                  </div>
                </div>
                <span className={styles.mockDelta}>
                  <Icon name="arrow_upward" size={15} />
                  <CountUp value="18.2%" />
                </span>
              </div>
              <div className={styles.chart}>
                {bars.map((bar, i) => (
                  <motion.span
                    key={i}
                    className={styles.chartBar}
                    style={{
                      height: `${bar.h}%`,
                      background: bar.fill,
                      transformOrigin: "bottom",
                    }}
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 170,
                      damping: 13,
                      mass: 0.9,
                      delay: 0.65 + i * 0.07,
                    }}
                  />
                ))}
              </div>
              <div className={styles.mockDivider} />
              <div className={styles.miniStats}>
                <div className={styles.miniStat}>
                  <div className={styles.miniLabel}>Active users</div>
                  <div className={styles.miniValue}>48,209</div>
                </div>
                <div className={styles.miniStat}>
                  <div className={styles.miniLabel}>Uptime</div>
                  <div className={styles.miniValue}>99.98%</div>
                </div>
              </div>
            </div>
          </div>
        </LiquidWobble>
      </motion.div>
    </Reveal>
  );
}
