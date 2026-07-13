"use client";

import { useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/Button";
import { IconBadge } from "@/components/ui/IconBadge";
import { cx } from "@/lib/cx";
import { EASE } from "@/lib/animations";
import { projectTypes, budgetRanges } from "@/content/contact";
import styles from "./contact.module.css";

type Status = "idle" | "sending" | "success";

export function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Front-end demo: native validation gates submission; wire to an API route
    // or form service here when the backend is ready.
    setStatus("sending");
    window.setTimeout(() => setStatus("success"), 900);
  }

  return (
    <div className={styles.formCard}>
      <span className={styles.formBlob} aria-hidden />
      <AnimatePresence mode="wait" initial={false}>
        {status === "success" ? (
          <motion.div
            key="success"
            className={styles.success}
            role="status"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
          >
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1, transition: { duration: 0.5, ease: EASE, delay: 0.15 } }}
            >
              <IconBadge name="check_circle" size={52} iconSize={28} />
            </motion.div>
            <h2 className={styles.successTitle}>Thanks — your inquiry is in.</h2>
            <p className={styles.successText}>
              We&apos;ve received your message and a member of our team will get back
              to you with actionable insights, usually within 12 hours.
            </p>
            <Button variant="outline" onClick={() => setStatus("idle")}>
              Send another message
            </Button>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            className={styles.form}
            onSubmit={handleSubmit}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.3, ease: EASE } }}
            exit={{ opacity: 0, y: -8, transition: { duration: 0.2 } }}
          >
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
                  placeholder="Sahan Perera"
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
                  placeholder="sahan@company.lk"
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
                placeholder="Lanka Digital"
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
              icon={status === "sending" ? undefined : "arrow_forward"}
              className={styles.submit}
              disabled={status === "sending"}
            >
              {status === "sending" ? "Sending…" : "Submit inquiry"}
            </Button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
