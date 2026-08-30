"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, FileText, Search } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { QuotationCountdown } from "@/components/admin/QuotationCountdown";
import { QuotationStatusPill } from "@/components/admin/QuotationStatusPill";
import { TimeAgo } from "@/components/admin/TimeAgo";
import { Button } from "@/components/ui/Button";
import { serviceLabel } from "@/content/quotation-options";
import {
  QUOTATION_PIPELINE,
  QUOTATION_STATUS_META,
  isAwaitingAutoSend,
} from "@/lib/quotation/status-meta";
import type { QuotationStatus, QuotationSummary } from "@/lib/quotation/types";
import { cx } from "@/lib/cx";
import styles from "@/components/admin/admin.module.css";
import quotationStyles from "@/components/admin/quotations.module.css";

type StatusFilter = "all" | QuotationStatus;

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

export function QuotationsClient({ quotations }: { quotations: QuotationSummary[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");

  const awaiting = useMemo(
    () => quotations.filter((quotation) => isAwaitingAutoSend(quotation.status)).length,
    [quotations],
  );

  // While anything is counting down, keep the list fresh so a status that flips
  // to "sent" by the worker appears without a manual reload.
  useEffect(() => {
    if (awaiting === 0) return;
    const timer = setInterval(() => router.refresh(), 20_000);
    return () => clearInterval(timer);
  }, [awaiting, router]);

  const counts = useMemo(() => {
    const result: Record<string, number> = { all: quotations.length };
    for (const value of QUOTATION_PIPELINE) {
      result[value] = quotations.filter((quotation) => quotation.status === value).length;
    }
    return result;
  }, [quotations]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return quotations
      .filter((quotation) => (status === "all" ? true : quotation.status === status))
      .filter((quotation) =>
        needle === ""
          ? true
          : [
              quotation.number,
              quotation.contactName,
              quotation.companyName,
              quotation.email,
              quotation.projectName,
            ]
              .filter(Boolean)
              .some((value) => value.toLowerCase().includes(needle)),
      )
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }, [quotations, query, status]);

  return (
    <>
      <PageHeader
        title="Quotations"
        subtitle={`${quotations.length} total · ${awaiting} awaiting review`}
      >
        <Button href="/admin/quotations/pricing" variant="outline" size="sm" icon="dollar">
          Pricing rules
        </Button>
      </PageHeader>

      <div className={styles.content}>
        <div className={styles.segment} style={{ marginBottom: 16 }}>
          {(["all", ...QUOTATION_PIPELINE] as StatusFilter[]).map((value) => (
            <button
              key={value}
              type="button"
              className={cx(styles.segItem, status === value && styles.segItemActive)}
              onClick={() => setStatus(value)}
            >
              {value === "all" ? "All" : QUOTATION_STATUS_META[value].label}
              <span className={styles.segCount}>{counts[value] ?? 0}</span>
            </button>
          ))}
        </div>

        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <Search size={16} className={styles.searchIcon} />
            <input
              className={styles.searchInput}
              placeholder="Search number, customer, project…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Search quotations"
            />
          </div>
        </div>

        {filtered.length > 0 ? (
          <div className={styles.tableWrap}>
            <table className={cx(styles.table, quotationStyles.staticRows)}>
              <thead>
                <tr>
                  <th>Quotation</th>
                  <th>Customer</th>
                  <th>Project</th>
                  <th>Estimate</th>
                  <th>Status</th>
                  <th>Review window</th>
                  <th>Received</th>
                  <th>
                    <span className={quotationStyles.srOnly}>Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((quotation) => (
                  <tr key={quotation.id}>
                    <td>
                      <Link
                        href={`/admin/quotations/${quotation.id}`}
                        className={quotationStyles.rowLink}
                      >
                        {quotation.number}
                      </Link>
                      {quotation.revision > 0 && (
                        <div className={styles.rowSub}>Revision {quotation.revision}</div>
                      )}
                    </td>
                    <td>
                      <div className={styles.rowName}>{quotation.contactName}</div>
                      <div className={styles.rowSub}>{quotation.companyName || quotation.email}</div>
                    </td>
                    <td>
                      <div className={styles.rowMuted}>{quotation.projectName}</div>
                      <div className={styles.rowSub}>{serviceLabel(quotation.service)}</div>
                    </td>
                    <td>
                      <div className={quotationStyles.amount}>
                        {money(quotation.rangeLow, quotation.currency)} –{" "}
                        {money(quotation.rangeHigh, quotation.currency)}
                      </div>
                      <div className={quotationStyles.amountSub}>
                        Total {money(quotation.total, quotation.currency)}
                      </div>
                    </td>
                    <td>
                      <QuotationStatusPill status={quotation.status} />
                    </td>
                    <td>
                      <QuotationCountdown
                        deadline={quotation.reviewDeadline}
                        status={quotation.status}
                        compact
                      />
                    </td>
                    <td className={styles.rowMuted}>
                      <TimeAgo iso={quotation.createdAt} />
                    </td>
                    <td>
                      <Link
                        href={`/admin/quotations/${quotation.id}`}
                        className={quotationStyles.viewLink}
                      >
                        Review <ChevronRight size={14} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={cx(styles.card, styles.empty)}>
            <FileText size={32} className={styles.emptyIcon} />
            <div>
              {quotations.length === 0
                ? "No estimate requests yet. They appear here the moment a customer submits one."
                : "No quotations match your filters."}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
