"use client";

import { useState } from "react";
import { MessageCircle, Mail, Trash2 } from "lucide-react";
import { Drawer } from "./Drawer";
import { StatusPill } from "./StatusPill";
import { Avatar } from "./Avatar";
import { leadsRepo, useTeam } from "@/lib/admin/store";
import { STATUS_META, PIPELINE } from "@/lib/admin/status";
import { formatDateTime, relativeTime } from "@/lib/admin/format";
import type { Lead } from "@/lib/admin/types";
import { cx } from "@/lib/cx";
import styles from "./admin.module.css";

type LeadDrawerProps = {
  lead: Lead | null;
  currentUser: string;
  onClose: () => void;
  onDeleted: () => void;
};

export function LeadDrawer({ lead, currentUser, onClose, onDeleted }: LeadDrawerProps) {
  const team = useTeam();
  const [noteBody, setNoteBody] = useState("");

  function submitNote() {
    const body = noteBody.trim();
    if (!body || !lead) return;
    leadsRepo.addNote(lead.id, currentUser, body);
    setNoteBody("");
  }

  // Derived reply links (only meaningful when a lead is open).
  const firstName = lead?.name.split(" ")[0] ?? "";
  const waDigits = lead?.phone?.replace(/\D/g, "");
  const waText = encodeURIComponent(
    `Hi ${firstName}, thanks for reaching out to Vezvora about your ${lead?.projectType} project. `,
  );
  const mailSubject = encodeURIComponent(`Re: your ${lead?.projectType} inquiry`);
  const mailBody = encodeURIComponent(`Hi ${firstName},\n\nThanks for reaching out to Vezvora. `);

  return (
    <Drawer
      open={Boolean(lead)}
      onClose={onClose}
      title={lead?.name ?? ""}
      subtitle={
        lead ? (
          <>
            {lead.company ? `${lead.company} · ` : ""}
            {relativeTime(lead.createdAt)} · via {lead.source}
          </>
        ) : undefined
      }
      footer={
        lead ? (
          <button
            type="button"
            className={styles.iconBtn}
            onClick={() => {
              leadsRepo.remove(lead.id);
              onDeleted();
            }}
            style={{ width: "auto", padding: "0 14px", gap: 8, color: "#ba1a1a" }}
          >
            <Trash2 size={16} /> Delete lead
          </button>
        ) : undefined
      }
    >
      {lead && (
        <>
      {/* Quick reply */}
      <div className={styles.quickReply}>
        {waDigits && (
          <a
            className={cx(styles.replyBtn, styles.replyWhatsapp)}
            href={`https://wa.me/${waDigits}?text=${waText}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle size={16} /> WhatsApp
          </a>
        )}
        <a
          className={cx(styles.replyBtn, styles.replyEmail)}
          href={`mailto:${lead.email}?subject=${mailSubject}&body=${mailBody}`}
        >
          <Mail size={16} /> Email
        </a>
      </div>

      {/* Pipeline */}
      <div className={styles.sectionLabel}>Status</div>
      <div className={styles.statusRow}>
        {PIPELINE.map((status) => {
          const meta = STATUS_META[status];
          const active = lead.status === status;
          return (
            <button
              key={status}
              type="button"
              className={styles.statusOpt}
              onClick={() => leadsRepo.setStatus(lead.id, status)}
              style={
                active
                  ? { color: meta.color, background: meta.bg, borderColor: "transparent" }
                  : undefined
              }
            >
              {meta.label}
            </button>
          );
        })}
      </div>

      {/* Assignee */}
      <div className={styles.sectionLabel}>Assigned to</div>
      <div className={styles.field}>
        <select
          className={styles.select}
          value={lead.assigneeId ?? ""}
          onChange={(e) => leadsRepo.assign(lead.id, e.target.value || null)}
        >
          <option value="">Unassigned</option>
          {team.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} ({m.role})
            </option>
          ))}
        </select>
      </div>

      {/* Details */}
      <div className={styles.kvGrid}>
        <div className={styles.kv}>
          <div className={styles.kvLabel}>Email</div>
          <div className={styles.kvValue}>{lead.email}</div>
        </div>
        <div className={styles.kv}>
          <div className={styles.kvLabel}>Phone</div>
          <div className={styles.kvValue}>{lead.phone ?? "—"}</div>
        </div>
        <div className={styles.kv}>
          <div className={styles.kvLabel}>Project type</div>
          <div className={styles.kvValue}>{lead.projectType}</div>
        </div>
        <div className={styles.kv}>
          <div className={styles.kvLabel}>Budget</div>
          <div className={styles.kvValue}>{lead.budget}</div>
        </div>
        <div className={styles.kv}>
          <div className={styles.kvLabel}>Status</div>
          <div className={styles.kvValue}>
            <StatusPill status={lead.status} />
          </div>
        </div>
        <div className={styles.kv}>
          <div className={styles.kvLabel}>Received</div>
          <div className={styles.kvValue}>{formatDateTime(lead.createdAt)}</div>
        </div>
      </div>

      <div className={styles.sectionLabel}>Message</div>
      <div className={styles.messageBox}>{lead.message}</div>

      {/* Notes */}
      <div className={styles.sectionLabel}>Internal notes</div>
      <div className={styles.noteList}>
        {lead.notes.length === 0 && <div className={styles.noteEmpty}>No notes yet.</div>}
        {lead.notes.map((note) => {
          const author = team.find((m) => m.name === note.author);
          return (
            <div key={note.id} className={styles.note}>
              <div className={styles.noteMeta}>
                <Avatar name={note.author} color={author?.color} size={22} />
                <span className={styles.noteAuthor}>{note.author}</span>
                <span className={styles.noteTime}>{relativeTime(note.createdAt)}</span>
              </div>
              <div className={styles.noteBody}>{note.body}</div>
            </div>
          );
        })}
      </div>
      <div className={styles.noteForm}>
        <textarea
          className={styles.textarea}
          placeholder="Add an internal note…"
          value={noteBody}
          onChange={(e) => setNoteBody(e.target.value)}
          rows={2}
        />
        <div>
          <button
            type="button"
            className={cx(styles.replyBtn, styles.replyEmail)}
            onClick={submitNote}
            disabled={!noteBody.trim()}
            style={!noteBody.trim() ? { opacity: 0.5 } : undefined}
          >
            Add note
          </button>
        </div>
      </div>
        </>
      )}
    </Drawer>
  );
}
