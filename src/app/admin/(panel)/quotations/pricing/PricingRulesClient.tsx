"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, RotateCcw, Save } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { savePricingConfigAction, type ActionResult } from "@/lib/quotation/actions";
import { cx } from "@/lib/cx";
import styles from "@/components/admin/admin.module.css";
import q from "@/components/admin/quotations.module.css";

/**
 * Rate-card editor. The stored configuration drives every new estimate, so
 * rates can change without a deploy. The server normalizes what is submitted —
 * an unrecognised or out-of-range value falls back to the shipped default
 * rather than producing broken prices.
 */
export function PricingRulesClient({ config, version }: { config: string; version: number }) {
  const router = useRouter();
  const [value, setValue] = useState(config);
  const [feedback, setFeedback] = useState<ActionResult | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    setFeedback(null);
    startTransition(async () => {
      const result = await savePricingConfigAction(value);
      setFeedback(result);
      if (result.ok) router.refresh();
    });
  }

  return (
    <>
      <PageHeader
        title="Pricing rules"
        subtitle={`Active version ${version} — applies to every new estimate`}
      />
      <div className={styles.content}>
        <Link href="/admin/quotations" className={q.backLink}>
          <ChevronLeft size={15} /> All quotations
        </Link>

        <section className={q.panel}>
          <div className={q.panelHead}>
            <h2 className={q.panelTitle}>Rate card</h2>
            <div className={q.actionBar}>
              <button
                type="button"
                className={q.action}
                onClick={() => {
                  setValue(config);
                  setFeedback(null);
                }}
                disabled={pending || value === config}
              >
                <RotateCcw size={15} /> Reset
              </button>
              <button
                type="button"
                className={cx(q.action, q.actionPrimary)}
                onClick={save}
                disabled={pending}
              >
                <Save size={15} /> {pending ? "Saving…" : "Save rules"}
              </button>
            </div>
          </div>
          <p className={q.panelHint}>
            Base prices, per-platform and per-feature rates, design and scalability tiers, QA and
            project-management percentages, tax, discount tiers, the schedule model, and the payment
            terms. Percentages are fractions (0.18 = 18%). Saving increments the version stamped on
            new quotations; existing quotations keep the figures they were generated with.
          </p>

          <textarea
            className={q.jsonEditor}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            spellCheck={false}
            aria-label="Pricing configuration JSON"
          />

          {feedback && (
            <p
              className={cx(q.feedback, feedback.ok ? q.feedbackOk : q.feedbackError)}
              role="status"
            >
              {feedback.ok ? feedback.message : feedback.error}
            </p>
          )}
        </section>
      </div>
    </>
  );
}
