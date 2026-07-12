"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { IconBadge } from "@/components/ui/IconBadge";
import { cx } from "@/lib/cx";
import { projectTypes, budgetRanges } from "@/content/contact";
import styles from "./contact.module.css";

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Front-end demo: native validation gates submission; wire to an API route
    // or form service here when the backend is ready.
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className={styles.formCard}>
        <span className={styles.formBlob} aria-hidden />
        <div className={styles.success} role="status">
          <IconBadge name="check_circle" size={52} iconSize={28} />
          <h2 className={styles.successTitle}>Thanks — your inquiry is in.</h2>
          <p className={styles.successText}>
            We&apos;ve received your message and a member of our team will get back
            to you with actionable insights, usually within 12 hours.
          </p>
          <Button variant="outline" onClick={() => setSubmitted(false)}>
            Send another message
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.formCard}>
      <span className={styles.formBlob} aria-hidden />
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.row2}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="name">
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              className={styles.control}
              placeholder="Jane Doe"
              autoComplete="name"
              required
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              className={styles.control}
              placeholder="jane@company.com"
              autoComplete="email"
              required
            />
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="company">
            Company
          </label>
          <input
            id="company"
            name="company"
            type="text"
            className={styles.control}
            placeholder="Acme Corp"
            autoComplete="organization"
          />
        </div>

        <div className={styles.row2}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="projectType">
              Project type
            </label>
            <select id="projectType" name="projectType" className={styles.control} defaultValue={projectTypes[0]}>
              {projectTypes.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="budget">
              Budget range
            </label>
            <select id="budget" name="budget" className={styles.control} defaultValue={budgetRanges[0]}>
              {budgetRanges.map((range) => (
                <option key={range}>{range}</option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="message">
            Message
          </label>
          <textarea
            id="message"
            name="message"
            rows={4}
            className={cx(styles.control, styles.textarea)}
            placeholder="Tell us about your goals..."
            required
          />
        </div>

        <Button
          type="submit"
          variant="accent"
          size="lg"
          icon="arrow_forward"
          className={styles.submit}
        >
          Submit inquiry
        </Button>
      </form>
    </div>
  );
}
