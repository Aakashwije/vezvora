"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ActionCentre } from "@/components/admin/ActionCentre";
import { DateRangeControl } from "@/components/admin/DateRangeControl";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusPill } from "@/components/admin/StatusPill";
import { Avatar } from "@/components/admin/Avatar";
import { TimeAgo } from "@/components/admin/TimeAgo";
import { memberById } from "@/lib/admin/store";
import { STATUS_META, PIPELINE } from "@/lib/admin/status";
import {
  compactMoney,
  formatDuration,
  type ActionGroup,
  type DashboardKpis,
  type DateRange,
} from "@/lib/admin/dashboard";
import type { Lead, TeamMember } from "@/lib/admin/types";
import { QUOTATION_PIPELINE, QUOTATION_STATUS_META } from "@/lib/quotation/status-meta";
import type { QuotationSummary } from "@/lib/quotation/types";
import styles from "@/components/admin/admin.module.css";
import d from "@/components/admin/dashboard.module.css";

type Props = {
  leads: Lead[];
  quotations: QuotationSummary[];
  kpis: DashboardKpis;
  groups: ActionGroup[];
  range: DateRange;
  team: TeamMember[];
};

type Tile = { label: string; value: string; hint?: string; muted?: boolean };

export function Overview({ leads, quotations, kpis, groups, range, team }: Props) {
  const router = useRouter();

  const tiles = useMemo<Tile[]>(
    () => [
      {
        label: "New leads",
        value: String(kpis.newLeads),
        hint: range.label.toLowerCase(),
      },
      {
        label: "Pipeline value",
        value: compactMoney(kpis.pendingValue, kpis.currency),
        hint: `${kpis.pendingCount} quotation${kpis.pendingCount === 1 ? "" : "s"} not yet sent`,
      },
      {
        label: "Quotations sent",
        value: String(kpis.quotationsSent),
        hint: range.label.toLowerCase(),
      },
      {
        label: "Average project value",
        value: kpis.quotationsRaised
          ? compactMoney(kpis.averageValue, kpis.currency)
          : "—",
        muted: kpis.quotationsRaised === 0,
        hint: kpis.quotationsRaised
          ? `across ${kpis.quotationsRaised} estimate${kpis.quotationsRaised === 1 ? "" : "s"}`
          : "no estimates in this period",
      },
      {
        label: "Lead to quotation",
        value: kpis.conversionPct === null ? "—" : `${kpis.conversionPct}%`,
        muted: kpis.conversionPct === null,
        hint:
          kpis.conversionPct === null
            ? "no leads in this period"
            : `${kpis.convertedLeads} of ${kpis.newLeads} went on to request an estimate`,
      },
      {
        label: "Average response time",
        value:
          kpis.averageResponseMinutes === null
            ? "—"
            : formatDuration(kpis.averageResponseMinutes),
        muted: kpis.averageResponseMinutes === null,
        hint:
          kpis.averageResponseMinutes === null
            ? "nothing reviewed in this period"
            : `first action on ${kpis.respondedCount} estimate${kpis.respondedCount === 1 ? "" : "s"}`,
      },
    ],
    [kpis, range.label],
  );

  const leadPipeline = useMemo(
    () =>
      PIPELINE.map((status) => ({
        status,
        count: leads.filter((lead) => lead.status === status).length,
      })),
    [leads],
  );

  const quotationPipeline = useMemo(
    () =>
      QUOTATION_PIPELINE.map((status) => ({
        status,
        count: quotations.filter((quotation) => quotation.status === status).length,
      })).filter((entry) => entry.count > 0),
    [quotations],
  );

  const recent = useMemo(
    () => [...leads].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 6),
    [leads],
  );

  const maxLead = Math.max(1, ...leadPipeline.map((entry) => entry.count));
  const maxQuotation = Math.max(1, ...quotationPipeline.map((entry) => entry.count));

  return (
    <>
      <PageHeader title="Dashboard" subtitle={`Reporting on the ${range.label.toLowerCase()}.`}>
        <DateRangeControl range={range} />
      </PageHeader>

      <div className={styles.content}>
        <div className={d.kpiGrid} style={{ marginBottom: 18 }}>
          {tiles.map((tile) => (
            <div key={tile.label} className={d.kpi}>
              <span className={d.kpiLabel}>{tile.label}</span>
              <div className={`${d.kpiValue} ${tile.muted ? d.kpiValueMuted : ""}`}>
                {tile.value}
              </div>
              {tile.hint && <p className={d.kpiHint}>{tile.hint}</p>}
            </div>
          ))}
        </div>

        <div style={{ marginBottom: 18 }}>
          <ActionCentre groups={groups} team={team} />
        </div>

        <div className={`${styles.grid} ${styles.cols2}`} style={{ marginBottom: 18 }}>
          <div className={styles.card}>
            <div className={styles.cardHead}>
              <span className={styles.cardTitle}>Lead pipeline</span>
              <Link href="/admin/leads" className={styles.cardLink}>
                View leads <ChevronRight size={14} />
              </Link>
            </div>
            <div className={styles.funnel}>
              {leadPipeline.map(({ status, count }) => (
                <div key={status} className={styles.funnelRow}>
                  <span className={styles.funnelLabel}>{STATUS_META[status].label}</span>
                  <span className={styles.funnelTrack}>
                    <span
                      className={styles.funnelFill}
                      style={{
                        width: `${(count / maxLead) * 100}%`,
                        background: STATUS_META[status].color,
                      }}
                    />
                  </span>
                  <span className={styles.funnelValue}>{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHead}>
              <span className={styles.cardTitle}>Quotation pipeline</span>
              <Link href="/admin/quotations" className={styles.cardLink}>
                View quotations <ChevronRight size={14} />
              </Link>
            </div>
            {quotationPipeline.length > 0 ? (
              <div className={styles.funnel}>
                {quotationPipeline.map(({ status, count }) => (
                  <div key={status} className={styles.funnelRow}>
                    <span className={styles.funnelLabel}>
                      {QUOTATION_STATUS_META[status].label}
                    </span>
                    <span className={styles.funnelTrack}>
                      <span
                        className={styles.funnelFill}
                        style={{
                          width: `${(count / maxQuotation) * 100}%`,
                          background: QUOTATION_STATUS_META[status].color,
                        }}
                      />
                    </span>
                    <span className={styles.funnelValue}>{count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className={d.panelHint}>No estimates have been submitted yet.</p>
            )}
          </div>
        </div>

        <div className={styles.card} style={{ padding: 0 }}>
          <div className={styles.cardHead} style={{ padding: "20px 22px 0" }}>
            <span className={styles.cardTitle}>Recent leads</span>
            <Link href="/admin/leads" className={styles.cardLink}>
              All leads <ChevronRight size={14} />
            </Link>
          </div>
          <div className={styles.tableWrap} style={{ border: "none", marginTop: 12 }}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Lead</th>
                  <th>Project</th>
                  <th>Status</th>
                  <th>Owner</th>
                  <th>Received</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((lead) => {
                  const owner = memberById(lead.assigneeId);
                  return (
                    <tr key={lead.id} onClick={() => router.push(`/admin/leads?lead=${lead.id}`)}>
                      <td>
                        <div className={styles.rowName}>{lead.name}</div>
                        <div className={styles.rowSub}>{lead.company ?? lead.email}</div>
                      </td>
                      <td className={styles.rowMuted}>{lead.projectType}</td>
                      <td>
                        <StatusPill status={lead.status} />
                      </td>
                      <td>
                        {owner ? (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                            <Avatar name={owner.name} color={owner.color} size={26} />
                            <span className={styles.rowMuted}>{owner.name}</span>
                          </span>
                        ) : (
                          <span className={styles.rowMuted}>Unassigned</span>
                        )}
                      </td>
                      <td className={styles.rowMuted}>
                        <TimeAgo iso={lead.createdAt} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
