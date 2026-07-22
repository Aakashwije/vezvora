"use client";

import { Fragment } from "react";
import Image from "next/image";
import { StaggerItem } from "@/components/motion/Stagger";
import { useCursorShadow } from "@/lib/useCursorShadow";
import type { Testimonial } from "@/content/home";
import styles from "@/app/page.module.css";

const HIGHLIGHTS = /(90%|100\+|praise the convincing experience)/;

/** Testimonial card with a green shadow, cast around the card, that leans toward the cursor on hover. */
export function TestimonialCard({
  testimonial,
  large,
}: {
  testimonial: Testimonial;
  large: boolean;
}) {
  const { boxShadow, onMouseMove, onMouseEnter, onMouseLeave } = useCursorShadow();

  return (
    <StaggerItem
      as="article"
      className={`${styles.testimonialCard} ${
        testimonial.featured ? styles.testimonialFeatured : ""
      }`}
      hoverLift
      style={{ boxShadow }}
      onMouseMove={onMouseMove}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className={styles.testimonialTop}>
        <span className={styles.testimonialLogo}>
          <Image
            src={testimonial.logo}
            alt={`${testimonial.company} logo`}
            fill
            sizes="88px"
            className={`${styles.testimonialLogoImage} ${
              large ? styles.testimonialLogoImageLarge : ""
            }`}
          />
        </span>
        {testimonial.draft && <span className={styles.testimonialDraft}>Draft copy</span>}
      </div>
      <blockquote className={styles.testimonialQuote}>
        “
        {testimonial.quote.split(HIGHLIGHTS).map((part, partIndex) =>
          part === "90%" || part === "100+" || part === "praise the convincing experience" ? (
            <mark key={partIndex} className={styles.testimonialHighlight}>
              {part}
            </mark>
          ) : (
            <Fragment key={partIndex}>{part}</Fragment>
          ),
        )}
        ”
      </blockquote>
      <div className={styles.testimonialPerson}>
        <strong>{testimonial.name}</strong>
        <span>
          {testimonial.role} · {testimonial.company}
        </span>
      </div>
    </StaggerItem>
  );
}
