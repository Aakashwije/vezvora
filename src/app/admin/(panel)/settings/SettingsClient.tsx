"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Avatar } from "@/components/admin/Avatar";
import { Button } from "@/components/ui/Button";
import { useSettings, useTeam, settingsRepo } from "@/lib/admin/store";
import type { SiteSettings } from "@/lib/admin/types";
import styles from "@/components/admin/admin.module.css";

export function SettingsClient() {
  const settings = useSettings();
  const team = useTeam();
  // Overlay of unsaved edits on top of the (possibly hydrating) store value —
  // avoids syncing a full local copy in an effect.
  const [edits, setEdits] = useState<Partial<SiteSettings>>({});
  const [saved, setSaved] = useState(false);

  const draft: SiteSettings = { ...settings, ...edits };

  function update<K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) {
    setEdits((e) => ({ ...e, [key]: value }));
    setSaved(false);
  }

  function save() {
    settingsRepo.save(draft);
    setEdits({});
    setSaved(true);
  }

  return (
    <>
      <PageHeader title="Settings" subtitle="Contact details, SEO defaults, and team." />

      <div className={styles.content}>
        <div className={`${styles.grid} ${styles.cols2}`}>
          <div className={styles.card}>
            <div className={styles.cardHead}>
              <span className={styles.cardTitle}>Site details</span>
            </div>

            <div className={styles.formRow}>
              <div className={styles.field}>
                <label className={styles.label}>Email</label>
                <input
                  className={styles.input}
                  type="email"
                  value={draft.email}
                  onChange={(e) => update("email", e.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Phone</label>
                <input
                  className={styles.input}
                  value={draft.phone}
                  onChange={(e) => update("phone", e.target.value)}
                />
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>WhatsApp URL</label>
              <input
                className={styles.input}
                value={draft.whatsappUrl}
                onChange={(e) => update("whatsappUrl", e.target.value)}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Office address</label>
              <input
                className={styles.input}
                value={draft.office}
                onChange={(e) => update("office", e.target.value)}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Meta title (SEO)</label>
              <input
                className={styles.input}
                value={draft.metaTitle}
                onChange={(e) => update("metaTitle", e.target.value)}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Meta description (SEO)</label>
              <textarea
                className={styles.textarea}
                value={draft.metaDescription}
                onChange={(e) => update("metaDescription", e.target.value)}
              />
            </div>

            <div className={styles.formActions}>
              <Button variant="accent" size="sm" onClick={save}>
                Save changes
              </Button>
              {saved && (
                <span className={styles.savedNote}>
                  <Check size={15} /> Saved
                </span>
              )}
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHead}>
              <span className={styles.cardTitle}>Team</span>
            </div>
            <div className={styles.noteList}>
              {team.map((member) => (
                <div key={member.id} className={styles.note} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Avatar name={member.name} color={member.color} size={36} />
                  <div style={{ flex: 1 }}>
                    <div className={styles.noteAuthor}>{member.name}</div>
                    <div className={styles.rowSub} style={{ textTransform: "capitalize" }}>
                      {member.role}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
