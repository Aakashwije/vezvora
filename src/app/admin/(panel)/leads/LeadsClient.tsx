"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Inbox } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusPill } from "@/components/admin/StatusPill";
import { Avatar } from "@/components/admin/Avatar";
import { LeadDrawer } from "@/components/admin/LeadDrawer";
import { Button } from "@/components/ui/Button";
import { useLeads, useTeam, memberById } from "@/lib/admin/store";
import { STATUS_META, PIPELINE } from "@/lib/admin/status";
import { leadsToCsv, downloadFile, relativeTime } from "@/lib/admin/format";
import type { LeadStatus } from "@/lib/admin/types";
import { cx } from "@/lib/cx";
import styles from "@/components/admin/admin.module.css";

type StatusFilter = "all" | LeadStatus;

export function LeadsClient({ currentUser }: { currentUser: string }) {
  const leads = useLeads();
  const team = useTeam();

  const searchParams = useSearchParams();

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [assignee, setAssignee] = useState<string>("all");
  // Deep-link: /admin/leads?lead=<id> opens that lead (SSR-consistent).
  const [selectedId, setSelectedId] = useState<string | null>(
    () => searchParams.get("lead"),
  );

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: leads.length };
    for (const s of PIPELINE) counts[s] = leads.filter((l) => l.status === s).length;
    return counts;
  }, [leads]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return leads
      .filter((l) => (status === "all" ? true : l.status === status))
      .filter((l) =>
        assignee === "all"
          ? true
          : assignee === "unassigned"
            ? l.assigneeId === null
            : l.assigneeId === assignee,
      )
      .filter((l) =>
        q === ""
          ? true
          : [l.name, l.email, l.company, l.message, l.projectType]
              .filter(Boolean)
              .some((v) => v!.toLowerCase().includes(q)),
      )
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }, [leads, query, status, assignee]);

  const selectedLead = leads.find((l) => l.id === selectedId) ?? null;

  function exportCsv() {
    downloadFile(`vezvora-leads-${new Date().toISOString().slice(0, 10)}.csv`, leadsToCsv(filtered));
  }

  return (
    <>
      <PageHeader title="Leads" subtitle={`${leads.length} total · ${statusCounts.new ?? 0} new`}>
        <Button variant="outline" size="sm" icon="download" onClick={exportCsv}>
          Export CSV
        </Button>
      </PageHeader>

      <div className={styles.content}>
        {/* Status segment */}
        <div className={styles.segment} style={{ marginBottom: 16 }}>
          {(["all", ...PIPELINE] as StatusFilter[]).map((s) => (
            <button
              key={s}
              type="button"
              className={cx(styles.segItem, status === s && styles.segItemActive)}
              onClick={() => setStatus(s)}
            >
              {s === "all" ? "All" : STATUS_META[s].label}
              <span className={styles.segCount}>{statusCounts[s] ?? 0}</span>
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <Search size={16} className={styles.searchIcon} />
            <input
              className={styles.searchInput}
              placeholder="Search name, email, company…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <select
            className={styles.select}
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            style={{ width: "auto" }}
            aria-label="Filter by owner"
          >
            <option value="all">All owners</option>
            <option value="unassigned">Unassigned</option>
            {team.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        {/* Table */}
        {filtered.length > 0 ? (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Lead</th>
                  <th>Contact</th>
                  <th>Project</th>
                  <th>Status</th>
                  <th>Owner</th>
                  <th>Received</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((lead) => {
                  const owner = memberById(lead.assigneeId);
                  return (
                    <tr key={lead.id} onClick={() => setSelectedId(lead.id)}>
                      <td>
                        <div className={styles.rowName}>{lead.name}</div>
                        <div className={styles.rowSub}>{lead.company ?? "—"}</div>
                      </td>
                      <td className={styles.rowMuted}>{lead.email}</td>
                      <td>
                        <div className={styles.rowMuted}>{lead.projectType}</div>
                        <div className={styles.rowSub}>{lead.budget}</div>
                      </td>
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
                      <td className={styles.rowMuted}>{relativeTime(lead.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={cx(styles.card, styles.empty)}>
            <Inbox size={32} className={styles.emptyIcon} />
            <div>No leads match your filters.</div>
          </div>
        )}
      </div>

      <LeadDrawer
        lead={selectedLead}
        currentUser={currentUser}
        onClose={() => setSelectedId(null)}
        onDeleted={() => setSelectedId(null)}
      />
    </>
  );
}
