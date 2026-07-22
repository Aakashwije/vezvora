import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site";

// Route segment config
export const alt = "Vezvora — Software that moves your business forward";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Dynamically rendered social card (Open Graph + Twitter). Rendered at
 * request time by next/og; kept font-fetch-free so it never depends on the
 * network. The brand dark gradient + lime/teal accent mirror the site.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          background:
            "linear-gradient(140deg, #1c2a24 0%, #23282f 55%, #1a2b2c 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Accent glow */}
        <div
          style={{
            position: "absolute",
            top: -180,
            right: -120,
            width: 620,
            height: 620,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(142,194,26,0.35) 0%, rgba(47,211,196,0.12) 45%, rgba(47,211,196,0) 70%)",
            display: "flex",
          }}
        />

        {/* Wordmark row */}
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(120deg, #8ec21a, #28b85f 55%, #2fd3c4)",
              color: "#0e2a1c",
              fontSize: 34,
              fontWeight: 800,
            }}
          >
            V
          </div>
          <div
            style={{
              fontSize: 30,
              fontWeight: 700,
              letterSpacing: 6,
              color: "#e7ece9",
            }}
          >
            {siteConfig.name}
          </div>
        </div>

        {/* Headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              fontSize: 76,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: -2,
              maxWidth: 900,
            }}
          >
            Software that moves your business&nbsp;
            <span
              style={{
                background: "linear-gradient(120deg, #b7de1d, #28b85f 55%, #2fd3c4)",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              forward
            </span>
            .
          </div>
          <div style={{ fontSize: 30, color: "#aab4b0", maxWidth: 820 }}>
            {siteConfig.tagline}
          </div>
        </div>

        {/* Footer row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            fontSize: 26,
            color: "#c6ceca",
          }}
        >
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: "#b7de1d",
              display: "flex",
            }}
          />
          {siteConfig.domain}
        </div>
      </div>
    ),
    { ...size },
  );
}
