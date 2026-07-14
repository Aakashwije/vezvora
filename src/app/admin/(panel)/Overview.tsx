"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatCard } from "@/components/admin/StatCard";
import { StatusPill } from "@/components/admin/StatusPill";
import { Avatar } from "@/components/admin/Avatar";
import { useLeads, memberById } from "@/lib/admin/store";
import { STATUS_META, PIPELINE } from "@/lib/admin/status";
import { relativeTime } from "@/lib/admin/format";
import styles from "@/components/admin/admin.module.css";

export function Overview() {
  const router = useRouter();
  const leads = useLeads();

  const stats = useMemo(() => {
    const total = leads.length;
    const newLeads = leads.filter((l) => l.status === "new").length;
    const open = leads.filter((l) => ["new", "contacted", "qualified"].includes(l.status)).length;
    const won = leads.filter((l) => l.status === "won").length;
    const decided = leads.filter((l) => l.status === "won" || l.status === "lost").length;
    const winRate = decided ? Math.round((won / decided) * 100) : 0;

    const byStatus = PIPELINE.map((s) => ({
      status: s,
      count: leads.filter((l) => l.status === s).length,
    }));

    const typeMap = new Map<string, number>();
    for (const l of leads) typeMap.set(l.projectType, (typeMap.get(l.projectType) ?? 0) + 1);
    const byType = [...typeMap.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);

    return { total, newLeads, open, won, winRate, byStatus, byType };
  }, [leads]);

  const recent = useMemo(
    () =>
      [...leads]
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
        .slice(0, 6),
    [leads],
  );

  const maxStatus = Math.max(1, ...stats.byStatus.map((s) => s.count));
  const maxType = Math.max(1, ...stats.byType.map((t) => t.count));

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Your leads and pipeline at a glance." />
      <div className={styles.content}>
        <div className={`${styles.grid} ${styles.cols4}`} style={{ marginBottom: 18 }}>
          <StatCard icon="inbox" label="Total leads" value={stats.total} />
          <StatCard
            icon="bolt"
            label="New leads"
            value={stats.newLeads}
            delta={stats.newLeads > 0 ? "needs action" : undefined}
          />
          <StatCard icon="filter" label="Open in pipeline" value={stats.open} />
          <StatCard
            icon="check_circle"
            label="Won"
            value={stats.won}
            delta={`${stats.winRate}% win rate`}
          />
        </div>

        <div className={`${styles.grid} ${styles.cols2}`} style={{ marginBottom: 18 }}>
          <div className={styles.card}>
            <div className={styles.cardHead}>
              <span className={styles.cardTitle}>Pipeline</span>
              <Link href="/admin/leads" className={styles.cardLink}>
                View leads <ChevronRight size={14} />
              </Link>
            </div>
            <div className={styles.funnel}>
              {stats.byStatus.map(({ status, count }) => (
                <div key={status} className={styles.funnelRow}>
                  <span className={styles.funnelLabel}>{STATUS_META[status].label}</span>
                  <span className={styles.funnelTrack}>
                    <span
                      className={styles.funnelFill}
                      style={{
                        width: `${(count / maxStatus) * 100}%`,
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
              <span className={styles.cardTitle}>By project type</span>
            </div>
            <div className={styles.funnel}>
              {stats.byType.map(({ label, count }) => (
                <div key={label} className={styles.funnelRow}>
                  <span className={styles.funnelLabel}>{label}</span>
                  <span className={styles.funnelTrack}>
                    <span
                      className={styles.funnelFill}
                      style={{ width: `${(count / maxType) * 100}%`, background: "var(--grad-accent)" }}
                    />
                  </span>
                  <span className={styles.funnelValue}>{count}</span>
                </div>
              ))}
            </div>
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
                      <td className={styles.rowMuted}>{relativeTime(lead.createdAt)}</td>
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
