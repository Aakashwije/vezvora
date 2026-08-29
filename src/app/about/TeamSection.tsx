"use client";

import { useState } from "react";
import Image from "next/image";
import { FlaskConical, ImagePlus } from "lucide-react";
import { leadershipTeam } from "@/content/about";
import styles from "./about.module.css";

type TeamView = "leadership" | "rnd";

export function TeamSection() {
  const [activeView, setActiveView] = useState<TeamView>("leadership");
  const [flippedMember, setFlippedMember] = useState<string | null>(null);

  return (
    <section className={styles.teamSection} aria-labelledby="team-heading">
      <div className="container">
        <div className={styles.teamHeading}>
          <div>
            <p className={styles.teamEyebrow}>The people behind Vezvora</p>
            <h2 id="team-heading">Meet our team.</h2>
          </div>

          <div className={styles.teamTabs} role="tablist" aria-label="Team groups">
            <button
              type="button"
              role="tab"
              id="leadership-tab"
              aria-controls="leadership-panel"
              aria-selected={activeView === "leadership"}
              className={activeView === "leadership" ? styles.activeTab : undefined}
              onClick={() => setActiveView("leadership")}
            >
              Senior Management
            </button>
            <button
              type="button"
              role="tab"
              id="rnd-tab"
              aria-controls="rnd-panel"
              aria-selected={activeView === "rnd"}
              className={activeView === "rnd" ? styles.activeTab : undefined}
              onClick={() => setActiveView("rnd")}
            >
              R&amp;D Team
            </button>
          </div>
        </div>

        {activeView === "leadership" ? (
          <div
            id="leadership-panel"
            role="tabpanel"
            aria-labelledby="leadership-tab"
            className={styles.teamGrid}
          >
            {leadershipTeam.map((member) => (
              <article key={member.name} className={styles.memberCard}>
                <button
                  type="button"
                  className={styles.portrait}
                  data-flipped={flippedMember === member.name}
                  aria-pressed={flippedMember === member.name}
                  aria-label={
                    flippedMember === member.name
                      ? `Show ${member.name}'s portrait`
                      : `Show ${member.name}'s industry background, ${member.company}`
                  }
                  onClick={() =>
                    setFlippedMember((current) => (current === member.name ? null : member.name))
                  }
                >
                  <span className={styles.portraitInner}>
                    <span className={styles.portraitFront}>
                      {member.image ? (
                        <Image
                          src={member.image}
                          alt={`${member.name}, ${member.title}`}
                          fill
                          sizes="(max-width: 620px) 100vw, (max-width: 1000px) 50vw, 25vw"
                          className={styles.portraitImage}
                        />
                      ) : (
                        <span
                          className={styles.portraitPlaceholder}
                          aria-label={`${member.name} portrait to be uploaded`}
                        >
                          <ImagePlus aria-hidden="true" size={30} strokeWidth={1.6} />
                          <span>Portrait coming soon</span>
                        </span>
                      )}
                    </span>
                    <span className={styles.companyBack} aria-hidden="true">
                      <span className={styles.companyLabel}>Industry background</span>
                      <span className={styles.companyLogoFrame}>
                        <Image
                          src={member.companyLogo}
                          alt=""
                          fill
                          sizes="220px"
                          className={styles.companyLogo}
                        />
                      </span>
                      <span className={styles.companyName}>{member.company}</span>
                    </span>
                  </span>
                </button>
                <div className={styles.memberDetails}>
                  <div>
                    <h3>{member.name}</h3>
                    <p>{member.title}</p>
                  </div>
                  <a
                    href={member.linkedinUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.linkedinLink}
                    aria-label={`Find ${member.name} on LinkedIn`}
                    title={`Find ${member.name} on LinkedIn`}
                  >
                    <span aria-hidden="true">in</span>
                  </a>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div
            id="rnd-panel"
            role="tabpanel"
            aria-labelledby="rnd-tab"
            className={styles.rndPending}
          >
            <FlaskConical aria-hidden="true" size={32} strokeWidth={1.6} />
            <h3>R&amp;D team profiles are in progress.</h3>
            <p>Photos and team details will be uploaded soon.</p>
          </div>
        )}
      </div>
    </section>
  );
}
