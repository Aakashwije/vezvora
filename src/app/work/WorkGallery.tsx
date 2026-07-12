"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { cx } from "@/lib/cx";
import { EASE } from "@/lib/animations";
import { projectFilters, projects, type ProjectFilter } from "@/content/work";
import styles from "./work.module.css";

const PAGE_SIZE = 4;

export function WorkGallery() {
  const [active, setActive] = useState<ProjectFilter>("All");
  const [visible, setVisible] = useState(PAGE_SIZE);

  const filtered = useMemo(
    () =>
      active === "All"
        ? projects
        : projects.filter((project) => project.category === active),
    [active],
  );

  const shown = filtered.slice(0, visible);
  const hasMore = filtered.length > visible;

  function selectFilter(filter: ProjectFilter) {
    setActive(filter);
    setVisible(PAGE_SIZE);
  }

  return (
    <>
      <div className={styles.filters} role="tablist" aria-label="Filter projects">
        {projectFilters.map((filter) => {
          const isActive = filter === active;
          return (
            <button
              key={filter}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={cx(styles.filter, isActive && styles.filterActive)}
              onClick={() => selectFilter(filter)}
            >
              {isActive && (
                <motion.span
                  layoutId="filter-pill"
                  className={styles.filterPill}
                  transition={{ duration: 0.35, ease: EASE }}
                />
              )}
              <span className={styles.filterLabel}>{filter}</span>
            </button>
          );
        })}
      </div>

      {shown.length > 0 ? (
        <div className={styles.grid}>
          <AnimatePresence mode="popLayout">
            {shown.map((project, index) => (
              <motion.article
                key={project.name}
                layout
                initial={{ opacity: 0, y: 24 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: {
                    duration: 0.55,
                    ease: EASE,
                    delay: Math.min(index * 0.06, 0.3),
                  },
                }}
                exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.2, ease: EASE } }}
                whileHover={{ y: -5, transition: { duration: 0.25, ease: EASE } }}
                className={styles.card}
              >
                <div className={styles.thumb} style={{ background: project.gradient }}>
                  <span className={styles.thumbPattern} aria-hidden />
                  <Icon name={project.icon} size={52} className={styles.thumbIcon} />
                  <span className={styles.tag}>{project.tag}</span>
                </div>
                <div className={styles.body}>
                  <h3 className={styles.name}>{project.name}</h3>
                  <p className={styles.desc}>{project.desc}</p>
                  <div className={styles.meta}>
                    <div className={styles.tech}>
                      {project.tech.map((tech) => (
                        <span key={tech} className={styles.techChip}>
                          {tech}
                        </span>
                      ))}
                    </div>
                    <a href="#" className={styles.caseLink}>
                      Case study
                      <Icon name="arrow_forward" size={16} />
                    </a>
                  </div>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <p className={styles.empty}>No projects in this category yet.</p>
      )}

      {hasMore && (
        <div className={styles.loadWrap}>
          <Button
            variant="outline"
            icon="sync"
            onClick={() => setVisible((v) => v + PAGE_SIZE)}
          >
            Load more projects
          </Button>
        </div>
      )}
    </>
  );
}
