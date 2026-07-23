"use client";

import styles from "@/components/admin/admin.module.css";
import { Drawer } from "@/components/admin/Drawer";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/Button";
import { projectFilters } from "@/content/work";
import { projectsRepo, useProjects } from "@/lib/admin/store";
import type { ManagedProject } from "@/lib/admin/types";
import { cx } from "@/lib/cx";
import {
  ArrowDown,
  ArrowUp,
  FolderKanban,
  Pencil,
  Star,
  Trash2,
} from "lucide-react";
import { useState } from "react";

const categories = projectFilters.filter((f) => f !== "All");

export function ContentClient() {
  const projects = useProjects();
  const ordered = [...projects].sort((a, b) => a.order - b.order);
  const [draft, setDraft] = useState<ManagedProject | null>(null);

  function openNew() {
    setDraft(projectsRepo.blankProject());
  }

  function save() {
    if (!draft || !draft.name.trim()) return;
    projectsRepo.save(draft);
    setDraft(null);
  }

  return (
    <>
      <PageHeader
        title="Work"
        subtitle={`${projects.length} projects in the portfolio`}
      >
        <Button variant="accent" size="sm" icon="add" onClick={openNew}>
          Add project
        </Button>
      </PageHeader>

      <div className={styles.content}>
        {ordered.length > 0 ? (
          <div className={styles.card} style={{ padding: 0 }}>
            {ordered.map((project, i) => (
              <div key={project.id} className={styles.projectRow}>
                <span
                  className={styles.projectSwatch}
                  style={{ background: project.gradient }}
                />
                <div className={styles.projectInfo}>
                  <div className={styles.projectName}>
                    {project.name || "Untitled project"}
                  </div>
                  <div className={styles.projectMeta}>
                    {project.category} · {project.tag}
                    {project.tech.length > 0 && ` · ${project.tech.join(", ")}`}
                  </div>
                </div>
                <div className={styles.projectActions}>
                  <button
                    type="button"
                    className={cx(
                      styles.featureToggle,
                      project.featured && styles.featureToggleOn,
                    )}
                    onClick={() => projectsRepo.toggleFeatured(project.id)}
                    title="Toggle featured"
                  >
                    <Star
                      size={13}
                      fill={project.featured ? "currentColor" : "none"}
                    />
                    Featured
                  </button>
                  <button
                    type="button"
                    className={styles.reorderBtn}
                    onClick={() => projectsRepo.reorder(project.id, -1)}
                    disabled={i === 0}
                    aria-label="Move up"
                  >
                    <ArrowUp size={15} />
                  </button>
                  <button
                    type="button"
                    className={styles.reorderBtn}
                    onClick={() => projectsRepo.reorder(project.id, 1)}
                    disabled={i === ordered.length - 1}
                    aria-label="Move down"
                  >
                    <ArrowDown size={15} />
                  </button>
                  <button
                    type="button"
                    className={styles.reorderBtn}
                    onClick={() => setDraft(project)}
                    aria-label="Edit"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    type="button"
                    className={styles.reorderBtn}
                    onClick={() => projectsRepo.remove(project.id)}
                    aria-label="Delete"
                    style={{ color: "#ba1a1a" }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={cx(styles.card, styles.empty)}>
            <FolderKanban size={32} className={styles.emptyIcon} />
            <div>No projects yet — add your first case study.</div>
          </div>
        )}
      </div>

      <Drawer
        open={Boolean(draft)}
        onClose={() => setDraft(null)}
        title={
          draft && projects.some((p) => p.id === draft.id)
            ? "Edit project"
            : "New project"
        }
        subtitle="Shown on the public Work page."
        footer={
          <>
            <Button variant="accent" size="sm" onClick={save}>
              Save project
            </Button>
            <Button variant="outline" size="sm" onClick={() => setDraft(null)}>
              Cancel
            </Button>
          </>
        }
      >
        {draft && (
          <>
            <div className={styles.formRow}>
              <div className={styles.field}>
                <label className={styles.label}>Name</label>
                <input
                  className={styles.input}
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  placeholder="Intimate Hygiene"
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Tag</label>
                <input
                  className={styles.input}
                  value={draft.tag}
                  onChange={(e) => setDraft({ ...draft, tag: e.target.value })}
                  placeholder="E-commerce"
                />
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Category</label>
              <select
                className={styles.select}
                value={draft.category}
                onChange={(e) =>
                  setDraft({ ...draft, category: e.target.value })
                }
              >
                {categories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Description</label>
              <textarea
                className={styles.textarea}
                value={draft.desc}
                onChange={(e) => setDraft({ ...draft, desc: e.target.value })}
                placeholder="What the product does and the outcome delivered."
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Tech (comma separated)</label>
              <input
                className={styles.input}
                value={draft.tech.join(", ")}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    tech: e.target.value
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean),
                  })
                }
                placeholder="React 19, Vite 8, Supabase, Tailwind CSS 4"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Cover gradient (CSS)</label>
              <input
                className={styles.input}
                value={draft.gradient}
                onChange={(e) =>
                  setDraft({ ...draft, gradient: e.target.value })
                }
              />
              <span
                className={styles.projectSwatch}
                style={{
                  background: draft.gradient,
                  width: "100%",
                  height: 64,
                  marginTop: 10,
                  borderRadius: 12,
                }}
              />
            </div>

            <button
              type="button"
              className={cx(
                styles.featureToggle,
                draft.featured && styles.featureToggleOn,
              )}
              onClick={() => setDraft({ ...draft, featured: !draft.featured })}
            >
              <Star size={13} fill={draft.featured ? "currentColor" : "none"} />
              {draft.featured ? "Featured on homepage" : "Not featured"}
            </button>
          </>
        )}
      </Drawer>
    </>
  );
}
