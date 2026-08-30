"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  CircleAlert,
  Download,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Save,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { QuotationCountdown } from "@/components/admin/QuotationCountdown";
import { QuotationStatusPill } from "@/components/admin/QuotationStatusPill";
import { TimeAgo } from "@/components/admin/TimeAgo";
import { formatDateTime } from "@/lib/admin/format";
import {
  budgetLabel,
  designLabel,
  featureLabel,
  integrationLabel,
  maintenanceLabel,
  platformLabel,
  serviceLabel,
  timelineLabel,
  volumeLabel,
} from "@/content/quotation-options";
import {
  regenerateQuotationPdfAction,
  retryQuotationEmailAction,
  saveQuotationAction,
  sendQuotationNowAction,
  setQuotationStatusAction,
  type ActionResult,
} from "@/lib/quotation/actions";
import {
  CONFIDENCE_META,
  EMAIL_STATE_LABEL,
  QUOTATION_STATUS_META,
  needsApproval,
} from "@/lib/quotation/status-meta";
import { mayAutoSend, type QuotationLineItem, type QuotationRecord } from "@/lib/quotation/types";
import { cx } from "@/lib/cx";
import styles from "@/components/admin/admin.module.css";
import q from "@/components/admin/quotations.module.css";

type EditableItem = QuotationLineItem & { key: string };

type Draft = {
  items: EditableItem[];
  discountPct: string;
  discountLabel: string;
  taxPct: string;
  taxLabel: string;
  deliveryLabel: string;
  validityDays: string;
  scopeSummary: string;
  assumptions: string[];
  exclusions: string[];
  adminNotes: string;
};

function toDraft(record: QuotationRecord): Draft {
  return {
    items: record.document.lineItems.map((item, index) => ({ ...item, key: `${item.id}-${index}` })),
    discountPct: String(Math.round(record.document.totals.discountPct * 10000) / 100),
    discountLabel: record.document.totals.discountLabel ?? "Discount",
    taxPct: String(Math.round(record.document.totals.taxPct * 10000) / 100),
    taxLabel: record.document.totals.taxLabel,
    deliveryLabel: record.document.schedule.deliveryLabel,
    validityDays: String(record.document.validityDays),
    scopeSummary: record.document.scopeSummary,
    assumptions: record.document.assumptions,
    exclusions: record.document.exclusions,
    adminNotes: record.adminNotes,
  };
}

function money(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${currency} ${Math.round(value).toLocaleString("en-US")}`;
  }
}

function toFraction(percent: string): number {
  const parsed = Number(percent);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.min(parsed, 100) / 100;
}

export function QuotationDetail({ record }: { record: QuotationRecord }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [draft, setDraft] = useState<Draft>(() => toDraft(record));
  const [feedback, setFeedback] = useState<ActionResult | null>(null);
  // Cache-buster so the preview iframe reloads after a save or regenerate.
  const [pdfVersion, setPdfVersion] = useState(0);

  const currency = record.document.totals.currency;
  const locked = record.status === "sent" || record.status === "sending";
  const meta = QUOTATION_STATUS_META[record.status];
  const confidence = CONFIDENCE_META[record.confidence.level];
  const autoSend = mayAutoSend(record);
  const awaitingApproval = needsApproval(record.status, autoSend);

  /* Live preview of the totals an administrator is editing. The server
     recomputes these authoritatively on save — this mirrors its arithmetic,
     including the configured rounding, so the preview matches what is stored. */
  const preview = useMemo(() => {
    const { rangeSpreadPct: spread, roundTo } = record.document.totals;
    const round = (value: number) => {
      const step = roundTo > 0 ? roundTo : 1;
      return Math.round(value / step) * step;
    };

    const subtotal = draft.items.reduce(
      (sum, item) => sum + round(item.quantity * item.unitPrice),
      0,
    );
    const discountAmount = round(subtotal * toFraction(draft.discountPct));
    const net = Math.max(subtotal - discountAmount, 0);
    const taxAmount = round(net * toFraction(draft.taxPct));
    const total = round(net + taxAmount);
    return {
      subtotal: round(subtotal),
      discountAmount,
      taxAmount,
      total,
      rangeLow: round(total * (1 - spread)),
      rangeHigh: round(total * (1 + spread)),
    };
  }, [draft, record.document.totals]);

  function run(action: () => Promise<ActionResult>, options: { refreshPdf?: boolean } = {}) {
    setFeedback(null);
    startTransition(async () => {
      const result = await action();
      setFeedback(result);
      if (result.ok && options.refreshPdf) setPdfVersion((value) => value + 1);
      router.refresh();
    });
  }

  function save() {
    run(
      () =>
        saveQuotationAction(record.id, {
          lineItems: draft.items.map((item) => ({
            id: item.id,
            category: item.category,
            description: item.description,
            detail: item.detail,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
          discountPct: toFraction(draft.discountPct),
          discountLabel: draft.discountLabel,
          taxPct: toFraction(draft.taxPct),
          taxLabel: draft.taxLabel,
          deliveryLabel: draft.deliveryLabel,
          validityDays: Number(draft.validityDays),
          scopeSummary: draft.scopeSummary,
          assumptions: draft.assumptions.filter(Boolean),
          exclusions: draft.exclusions.filter(Boolean),
          adminNotes: draft.adminNotes,
        }),
      { refreshPdf: true },
    );
  }

  function updateItem(key: string, patch: Partial<EditableItem>) {
    setDraft((current) => ({
      ...current,
      items: current.items.map((item) => (item.key === key ? { ...item, ...patch } : item)),
    }));
  }

  function addItem() {
    setDraft((current) => ({
      ...current,
      items: [
        ...current.items,
        {
          key: `custom-${Date.now()}`,
          id: `custom-${Date.now()}`,
          category: "feature",
          description: "",
          quantity: 1,
          unitPrice: 0,
          total: 0,
        },
      ],
    }));
  }

  const pdfUrl = `/api/quotations/${record.id}/pdf?v=${pdfVersion}`;
  const requirements = record.requirements;

  return (
    <>
      <PageHeader
        title={record.number}
        subtitle={`${requirements.projectName} · ${requirements.contactName}${
          requirements.companyName ? ` (${requirements.companyName})` : ""
        }`}
      >
        <a
          className={cx(q.action)}
          href={`${pdfUrl}&download=1`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Download size={15} /> Download PDF
        </a>
      </PageHeader>

      <div className={styles.content}>
        <Link href="/admin/quotations" className={q.backLink}>
          <ChevronLeft size={15} /> All quotations
        </Link>

        {/* Status + actions */}
        <div className={q.banner} style={{ marginBottom: 18 }}>
          <QuotationStatusPill status={record.status} />
          <span
            className={q.confidenceChip}
            style={{ color: confidence.color, background: confidence.bg }}
            title={`Confidence score ${record.confidence.score} out of 100`}
          >
            {confidence.label}
          </span>
          <span className={q.bannerText}>
            <strong className={q.bannerTitle}>{meta.description}</strong>
            Submitted <TimeAgo iso={record.createdAt} /> · Revision {record.revision} · Email{" "}
            {EMAIL_STATE_LABEL[record.email.state].toLowerCase()}
            {record.sentAt ? ` on ${formatDateTime(record.sentAt)}` : ""}
          </span>
          <QuotationCountdown
            deadline={record.reviewDeadline}
            status={record.status}
            autoSend={autoSend}
          />
        </div>

        {awaitingApproval && (
          <div className={q.approval} role="status" style={{ marginBottom: 18 }}>
            <CircleAlert size={18} className={q.approvalIcon} aria-hidden />
            <div className={q.approvalBody}>
              <strong className={q.approvalTitle}>
                This estimate will not be emailed on its own
              </strong>
              <p className={q.approvalReason}>{record.confidence.reviewReason}</p>
              {record.confidence.flags.length > 0 && (
                <ul className={q.approvalFlags}>
                  {record.confidence.flags.map((flag) => (
                    <li key={flag.code}>{flag.label}</li>
                  ))}
                </ul>
              )}
              <p className={q.approvalHint}>
                Approve to release it — it sends at the review deadline, or within moments if that
                has already passed. Send now emails it immediately.
              </p>
            </div>
          </div>
        )}

        <div className={q.actionBar} style={{ marginBottom: 18 }}>
          <button
            type="button"
            className={cx(q.action, q.actionAccent)}
            onClick={() => run(() => sendQuotationNowAction(record.id))}
            disabled={pending || locked}
          >
            <Send size={15} /> Send now
          </button>
          <button
            type="button"
            className={cx(q.action, q.actionPrimary)}
            onClick={save}
            disabled={pending || locked}
          >
            <Save size={15} /> Save changes
          </button>
          {record.status === "held" ? (
            <button
              type="button"
              className={q.action}
              onClick={() => run(() => setQuotationStatusAction(record.id, "pending_review"))}
              disabled={pending}
            >
              <Play size={15} /> Resume review
            </button>
          ) : (
            <button
              type="button"
              className={q.action}
              onClick={() => run(() => setQuotationStatusAction(record.id, "held"))}
              disabled={pending || locked}
            >
              <Pause size={15} /> Hold
            </button>
          )}
          <button
            type="button"
            className={cx(q.action, awaitingApproval && q.actionPrimary)}
            onClick={() => run(() => setQuotationStatusAction(record.id, "approved"))}
            disabled={pending || locked || record.status === "approved"}
          >
            Approve
          </button>
          <button
            type="button"
            className={q.action}
            onClick={() => run(() => regenerateQuotationPdfAction(record.id), { refreshPdf: true })}
            disabled={pending}
          >
            <RefreshCw size={15} /> Regenerate PDF
          </button>
          {record.status === "failed" && (
            <button
              type="button"
              className={cx(q.action, q.actionPrimary)}
              onClick={() => run(() => retryQuotationEmailAction(record.id))}
              disabled={pending}
            >
              <Send size={15} /> Retry email
            </button>
          )}
          <button
            type="button"
            className={cx(q.action, q.actionDanger)}
            onClick={() => run(() => setQuotationStatusAction(record.id, "cancelled"))}
            disabled={pending || locked || record.status === "cancelled"}
          >
            <X size={15} /> Cancel
          </button>
        </div>

        {feedback && (
          <p
            className={cx(q.feedback, feedback.ok ? q.feedbackOk : q.feedbackError)}
            role="status"
            style={{ marginBottom: 14 }}
          >
            {feedback.ok ? feedback.message : feedback.error}
          </p>
        )}

        {record.email.state === "failed" && record.email.lastError && (
          <div className={q.warning} style={{ marginBottom: 18 }}>
            <CircleAlert size={17} className={q.warningIcon} />
            <span>
              Last delivery attempt failed: {record.email.lastError} ({record.email.attempts}{" "}
              attempt{record.email.attempts === 1 ? "" : "s"})
            </span>
          </div>
        )}

        <div className={q.detailGrid}>
          {/* ---------------- Left column: the editor ---------------- */}
          <div className={q.stack}>
            <section className={q.panel}>
              <div className={q.panelHead}>
                <h2 className={q.panelTitle}>Line items</h2>
                <button type="button" className={q.action} onClick={addItem} disabled={locked}>
                  <Plus size={15} /> Add item
                </button>
              </div>
              <p className={q.panelHint}>
                Quantities and unit prices are re-multiplied on the server when you save; totals
                shown here are a preview.
              </p>

              <div className={q.itemsWrap}>
                <table className={q.items}>
                  <thead>
                    <tr>
                      <th>Scope item</th>
                      <th>Qty</th>
                      <th>Unit price</th>
                      <th>Amount</th>
                      <th>
                        <span className={q.srOnly}>Remove</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {draft.items.map((item) => (
                      <tr key={item.key}>
                        <td>
                          <input
                            className={q.itemInput}
                            value={item.description}
                            onChange={(event) =>
                              updateItem(item.key, { description: event.target.value })
                            }
                            disabled={locked}
                            aria-label="Item description"
                            maxLength={160}
                          />
                          <input
                            className={cx(q.itemInput, q.itemDetail)}
                            value={item.detail ?? ""}
                            onChange={(event) => updateItem(item.key, { detail: event.target.value })}
                            placeholder="Optional detail line"
                            disabled={locked}
                            aria-label="Item detail"
                            maxLength={200}
                          />
                        </td>
                        <td>
                          <input
                            className={cx(q.itemInput, q.itemQty, q.itemNumber)}
                            type="number"
                            min={1}
                            max={9999}
                            value={item.quantity}
                            onChange={(event) =>
                              updateItem(item.key, { quantity: Number(event.target.value) || 1 })
                            }
                            disabled={locked}
                            aria-label="Quantity"
                          />
                        </td>
                        <td>
                          <input
                            className={cx(q.itemInput, q.itemPrice, q.itemNumber)}
                            type="number"
                            min={0}
                            step={500}
                            value={item.unitPrice}
                            onChange={(event) =>
                              updateItem(item.key, { unitPrice: Number(event.target.value) || 0 })
                            }
                            disabled={locked}
                            aria-label="Unit price"
                          />
                        </td>
                        <td className={q.itemTotal}>
                          {money(Math.round(item.quantity * item.unitPrice), currency)}
                        </td>
                        <td>
                          <button
                            type="button"
                            className={q.itemRemove}
                            onClick={() =>
                              setDraft((current) => ({
                                ...current,
                                items: current.items.filter((entry) => entry.key !== item.key),
                              }))
                            }
                            disabled={locked || draft.items.length <= 1}
                            aria-label={`Remove ${item.description || "line item"}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className={q.rateRow} style={{ marginTop: 20 }}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="discountLabel">
                    Discount label
                  </label>
                  <input
                    id="discountLabel"
                    className={styles.input}
                    value={draft.discountLabel}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, discountLabel: event.target.value }))
                    }
                    disabled={locked}
                    maxLength={60}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="discountPct">
                    Discount
                  </label>
                  <div className={q.suffixField}>
                    <input
                      id="discountPct"
                      className={styles.input}
                      type="number"
                      min={0}
                      max={100}
                      step={0.5}
                      value={draft.discountPct}
                      onChange={(event) =>
                        setDraft((current) => ({ ...current, discountPct: event.target.value }))
                      }
                      disabled={locked}
                    />
                    <span className={q.suffix}>%</span>
                  </div>
                </div>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="taxLabel">
                    Tax label
                  </label>
                  <input
                    id="taxLabel"
                    className={styles.input}
                    value={draft.taxLabel}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, taxLabel: event.target.value }))
                    }
                    disabled={locked}
                    maxLength={60}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="taxPct">
                    Tax rate
                  </label>
                  <div className={q.suffixField}>
                    <input
                      id="taxPct"
                      className={styles.input}
                      type="number"
                      min={0}
                      max={100}
                      step={0.5}
                      value={draft.taxPct}
                      onChange={(event) =>
                        setDraft((current) => ({ ...current, taxPct: event.target.value }))
                      }
                      disabled={locked}
                    />
                    <span className={q.suffix}>%</span>
                  </div>
                </div>
              </div>

              <div className={q.totals}>
                <div className={q.totalRow}>
                  <span>Subtotal</span>
                  <span className={q.totalValue}>{money(preview.subtotal, currency)}</span>
                </div>
                {preview.discountAmount > 0 && (
                  <div className={q.totalRow}>
                    <span>{draft.discountLabel}</span>
                    <span className={q.totalValue}>-{money(preview.discountAmount, currency)}</span>
                  </div>
                )}
                {preview.taxAmount > 0 && (
                  <div className={q.totalRow}>
                    <span>{draft.taxLabel}</span>
                    <span className={q.totalValue}>{money(preview.taxAmount, currency)}</span>
                  </div>
                )}
                <div className={cx(q.totalRow, q.totalRowStrong)}>
                  <span>Estimated total</span>
                  <span>{money(preview.total, currency)}</span>
                </div>
              </div>

              <div className={q.rangeBox}>
                <div className={q.rangeLabel}>Estimated price range shown to the customer</div>
                <div className={q.rangeValue}>
                  {money(preview.rangeLow, currency)} – {money(preview.rangeHigh, currency)}
                </div>
              </div>
            </section>

            <section className={q.panel}>
              <div className={q.panelHead}>
                <h2 className={q.panelTitle}>Summary, delivery & validity</h2>
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="scopeSummary">
                  Project summary
                </label>
                <textarea
                  id="scopeSummary"
                  className={styles.textarea}
                  value={draft.scopeSummary}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, scopeSummary: event.target.value }))
                  }
                  disabled={locked}
                  maxLength={1200}
                  rows={3}
                />
              </div>
              <div className={styles.formRow}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="deliveryLabel">
                    Estimated delivery
                  </label>
                  <input
                    id="deliveryLabel"
                    className={styles.input}
                    value={draft.deliveryLabel}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, deliveryLabel: event.target.value }))
                    }
                    disabled={locked}
                    maxLength={80}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="validityDays">
                    Valid for (days)
                  </label>
                  <input
                    id="validityDays"
                    className={styles.input}
                    type="number"
                    min={1}
                    max={365}
                    value={draft.validityDays}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, validityDays: event.target.value }))
                    }
                    disabled={locked}
                  />
                </div>
              </div>

              <ListEditor
                label="Assumptions"
                items={draft.assumptions}
                disabled={locked}
                onChange={(assumptions) => setDraft((current) => ({ ...current, assumptions }))}
              />
              <ListEditor
                label="Exclusions"
                items={draft.exclusions}
                disabled={locked}
                onChange={(exclusions) => setDraft((current) => ({ ...current, exclusions }))}
              />
            </section>

            <section className={q.panel}>
              <div className={q.panelHead}>
                <h2 className={q.panelTitle}>Internal notes</h2>
              </div>
              <p className={q.panelHint}>Never included in the quotation or the customer email.</p>
              <textarea
                className={styles.textarea}
                value={draft.adminNotes}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, adminNotes: event.target.value }))
                }
                placeholder="Context for the team — negotiation history, risks, who to loop in…"
                maxLength={4000}
                rows={4}
                aria-label="Internal notes"
              />
            </section>

            <section className={q.panel}>
              <div className={q.panelHead}>
                <h2 className={q.panelTitle}>PDF preview</h2>
                <a
                  className={q.action}
                  href={`${pdfUrl}&download=1`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Download size={15} /> Download
                </a>
              </div>
              <iframe className={q.pdfFrame} src={pdfUrl} title={`Quotation ${record.number} PDF`} />
              <p className={q.pdfNote}>
                Rendered live from the current revision. Save your changes, then reload the preview
                to see them.
              </p>
            </section>
          </div>

          {/* ---------------- Right column: context ---------------- */}
          <div className={q.stack}>
            <section className={q.panel}>
              <div className={q.panelHead}>
                <h2 className={q.panelTitle}>Customer</h2>
              </div>
              <div className={styles.kvGrid}>
                <div className={styles.kv}>
                  <div className={styles.kvLabel}>Name</div>
                  <div className={styles.kvValue}>{requirements.contactName}</div>
                </div>
                <div className={styles.kv}>
                  <div className={styles.kvLabel}>Company</div>
                  <div className={styles.kvValue}>{requirements.companyName || "—"}</div>
                </div>
                <div className={styles.kv}>
                  <div className={styles.kvLabel}>Email</div>
                  <div className={styles.kvValue}>{requirements.email}</div>
                </div>
                <div className={styles.kv}>
                  <div className={styles.kvLabel}>Phone</div>
                  <div className={styles.kvValue}>{requirements.phone}</div>
                </div>
              </div>
              <div className={q.actionBar}>
                <a className={q.action} href={`mailto:${requirements.email}`}>
                  Email customer
                </a>
                <a
                  className={q.action}
                  href={`https://wa.me/${requirements.phone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  WhatsApp
                </a>
              </div>
            </section>

            <section className={q.panel}>
              <div className={q.panelHead}>
                <h2 className={q.panelTitle}>Original requirements</h2>
              </div>
              <div className={styles.sectionLabel}>Description</div>
              <div className={styles.messageBox}>{requirements.description}</div>
              {requirements.notes && (
                <>
                  <div className={styles.sectionLabel}>Additional notes</div>
                  <div className={styles.messageBox}>{requirements.notes}</div>
                </>
              )}
              <div className={styles.kvGrid}>
                <div className={styles.kv}>
                  <div className={styles.kvLabel}>Service</div>
                  <div className={styles.kvValue}>{serviceLabel(requirements.service)}</div>
                </div>
                <div className={styles.kv}>
                  <div className={styles.kvLabel}>Design</div>
                  <div className={styles.kvValue}>{designLabel(requirements.design)}</div>
                </div>
                <div className={styles.kv}>
                  <div className={styles.kvLabel}>Scale</div>
                  <div className={styles.kvValue}>{volumeLabel(requirements.userVolume)}</div>
                </div>
                <div className={styles.kv}>
                  <div className={styles.kvLabel}>Timeline</div>
                  <div className={styles.kvValue}>{timelineLabel(requirements.timeline)}</div>
                </div>
                <div className={styles.kv}>
                  <div className={styles.kvLabel}>Support</div>
                  <div className={styles.kvValue}>{maintenanceLabel(requirements.maintenance)}</div>
                </div>
                <div className={styles.kv}>
                  <div className={styles.kvLabel}>Budget</div>
                  <div className={styles.kvValue}>{budgetLabel(requirements.budget)}</div>
                </div>
              </div>
              <div className={styles.sectionLabel}>Platforms</div>
              <div className={styles.messageBox}>
                {requirements.platforms.map(platformLabel).join(", ") || "—"}
              </div>
              <div className={styles.sectionLabel}>Features</div>
              <div className={styles.messageBox}>
                {requirements.features.map(featureLabel).join(", ") || "—"}
              </div>
              <div className={styles.sectionLabel}>Integrations</div>
              <div className={styles.messageBox}>
                {requirements.integrations.map(integrationLabel).join(", ") || "None"}
              </div>
            </section>

            <section className={q.panel}>
              <div className={q.panelHead}>
                <h2 className={q.panelTitle}>Revision history</h2>
              </div>
              {record.revisions.length === 0 ? (
                <p className={q.panelHint}>No edits yet — this is the originally generated estimate.</p>
              ) : (
                <div className={q.timeline}>
                  {[...record.revisions].reverse().map((revision) => (
                    <div key={revision.revision} className={q.timelineItem}>
                      <div className={q.timelineHead}>
                        <span className={q.timelineTitle}>
                          Revision {revision.revision} · {revision.actor}
                        </span>
                        <span className={q.timelineTime}>{formatDateTime(revision.at)}</span>
                      </div>
                      <ul className={q.changeList}>
                        {revision.changes.map((change) => (
                          <li key={change}>{change}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className={q.panel}>
              <div className={q.panelHead}>
                <h2 className={q.panelTitle}>Audit trail</h2>
              </div>
              <div className={q.timeline}>
                {[...record.activity].reverse().map((entry) => (
                  <div key={entry.id} className={q.timelineItem}>
                    <div className={q.timelineHead}>
                      <span className={q.timelineTitle}>
                        {entry.action.replace(/_/g, " ")} · {entry.actor}
                      </span>
                      <span className={q.timelineTime}>{formatDateTime(entry.at)}</span>
                    </div>
                    {entry.detail && <div className={q.timelineBody}>{entry.detail}</div>}
                  </div>
                ))}
              </div>
            </section>

            <section className={q.panel}>
              <div className={q.panelHead}>
                <h2 className={q.panelTitle}>Delivery</h2>
              </div>
              <div className={styles.kvGrid}>
                <div className={styles.kv}>
                  <div className={styles.kvLabel}>Email state</div>
                  <div className={styles.kvValue}>{EMAIL_STATE_LABEL[record.email.state]}</div>
                </div>
                <div className={styles.kv}>
                  <div className={styles.kvLabel}>Attempts</div>
                  <div className={styles.kvValue}>{record.email.attempts}</div>
                </div>
                <div className={styles.kv}>
                  <div className={styles.kvLabel}>Provider</div>
                  <div className={styles.kvValue}>{record.email.provider ?? "—"}</div>
                </div>
                <div className={styles.kv}>
                  <div className={styles.kvLabel}>Message ID</div>
                  <div className={styles.kvValue}>{record.email.messageId ?? "—"}</div>
                </div>
                <div className={styles.kv}>
                  <div className={styles.kvLabel}>Scheduler</div>
                  <div className={styles.kvValue}>{record.scheduler}</div>
                </div>
                <div className={styles.kv}>
                  <div className={styles.kvLabel}>Auto-send at</div>
                  <div className={styles.kvValue}>{formatDateTime(record.reviewDeadline)}</div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}

function ListEditor({
  label,
  items,
  onChange,
  disabled,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  disabled?: boolean;
}) {
  return (
    <div className={styles.field}>
      <span className={styles.label}>{label}</span>
      <div className={q.listEditor}>
        {items.map((item, index) => (
          <div className={q.listRow} key={`${label}-${index}`}>
            <input
              className={q.itemInput}
              value={item}
              onChange={(event) => {
                const next = [...items];
                next[index] = event.target.value;
                onChange(next);
              }}
              disabled={disabled}
              maxLength={400}
              aria-label={`${label} ${index + 1}`}
            />
            <button
              type="button"
              className={q.itemRemove}
              style={{ marginTop: 0 }}
              onClick={() => onChange(items.filter((_, position) => position !== index))}
              disabled={disabled || items.length <= 1}
              aria-label={`Remove ${label.toLowerCase()} ${index + 1}`}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        <div>
          <button
            type="button"
            className={q.action}
            onClick={() => onChange([...items, ""])}
            disabled={disabled || items.length >= 20}
          >
            <Plus size={15} /> Add {label.toLowerCase().replace(/s$/, "")}
          </button>
        </div>
      </div>
    </div>
  );
}
