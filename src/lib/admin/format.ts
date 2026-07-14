import type { Lead } from "./types";
import { memberById } from "./store";

/** Relative time like "3h ago", "2d ago" against now. */
export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.round(days / 30);
  return `${months}mo ago`;
}

/** Absolute date like "14 Jul 2026, 09:00". */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function csvCell(value: string): string {
  const needsQuotes = /[",\n]/.test(value);
  const escaped = value.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
}

/** Serialize leads to CSV text. */
export function leadsToCsv(leads: Lead[]): string {
  const headers = [
    "ID",
    "Name",
    "Email",
    "Company",
    "Phone",
    "Project type",
    "Budget",
    "Status",
    "Assignee",
    "Source",
    "Created",
    "Message",
  ];
  const rows = leads.map((l) =>
    [
      l.id,
      l.name,
      l.email,
      l.company ?? "",
      l.phone ?? "",
      l.projectType,
      l.budget,
      l.status,
      memberById(l.assigneeId)?.name ?? "Unassigned",
      l.source,
      l.createdAt,
      l.message,
    ]
      .map((v) => csvCell(String(v)))
      .join(","),
  );
  return [headers.join(","), ...rows].join("\n");
}

/** Trigger a browser download of a text file. */
export function downloadFile(filename: string, content: string, type = "text/csv") {
  const blob = new Blob([content], { type: `${type};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
