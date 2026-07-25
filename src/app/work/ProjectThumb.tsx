"use client";

import { Icon, type IconName } from "@/components/ui/Icon";
import Image from "next/image";
import { useRef, useState } from "react";
import { cx } from "@/lib/cx";
import styles from "./work.module.css";

type ProjectThumbProps = {
  name: string;
  tag: string;
  icon: IconName;
  gradient: string;
  screenshots?: string[];
  screenshotFit?: "cover" | "contain";
};

export function ProjectThumb({
  name,
  tag,
  icon,
  gradient,
  screenshots,
  screenshotFit = "cover",
}: ProjectThumbProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const shots = screenshots ?? [];
  const hasShots = shots.length > 0;
  const hasMultiple = shots.length > 1;

  function goTo(index: number) {
    const track = trackRef.current;
    if (!track) return;
    const clamped = Math.max(0, Math.min(index, shots.length - 1));
    track.scrollTo({ left: clamped * track.clientWidth, behavior: "smooth" });
    setActive(clamped);
  }

  function handleScroll() {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0) return;
    setActive(Math.round(track.scrollLeft / track.clientWidth));
  }

  function stop(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  return (
    <div className={styles.thumb} style={{ background: gradient }}>
      {hasShots ? (
        <div
          ref={trackRef}
          className={styles.thumbTrack}
          onScroll={handleScroll}
        >
          {shots.map((src, index) => (
            <div className={styles.thumbSlide} key={src}>
              <Image
                src={src}
                alt={`${name} screenshot ${index + 1}`}
                fill
                sizes="(max-width: 720px) 100vw, 50vw"
                className={cx(
                  styles.thumbImage,
                  screenshotFit === "contain" && styles.thumbImageContain,
                )}
              />
            </div>
          ))}
        </div>
      ) : (
        <>
          <span className={styles.thumbPattern} aria-hidden />
          <Icon name={icon} size={52} className={styles.thumbIcon} />
        </>
      )}

      <span className={styles.tag}>{tag}</span>

      {hasMultiple && (
        <>
          <button
            type="button"
            className={`${styles.thumbNav} ${styles.thumbNavPrev}`}
            onClick={(event) => {
              stop(event);
              goTo(active - 1);
            }}
            aria-label={`Previous screenshot of ${name}`}
          >
            <Icon name="chevron_left" size={18} />
          </button>
          <button
            type="button"
            className={`${styles.thumbNav} ${styles.thumbNavNext}`}
            onClick={(event) => {
              stop(event);
              goTo(active + 1);
            }}
            aria-label={`Next screenshot of ${name}`}
          >
            <Icon name="chevron_right" size={18} />
          </button>
          <div className={styles.thumbDots}>
            {shots.map((src, index) => (
              <button
                key={src}
                type="button"
                className={`${styles.thumbDot} ${
                  index === active ? styles.thumbDotActive : ""
                }`}
                onClick={(event) => {
                  stop(event);
                  goTo(index);
                }}
                aria-label={`Go to screenshot ${index + 1} of ${name}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
