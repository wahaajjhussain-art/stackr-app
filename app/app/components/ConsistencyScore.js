"use client";

/* ── Design Tokens (match landing page :root) ── */
const ACCENT2  = "#2F6B43";
const ACCENT3  = "#5A9E72";
const GOLD3    = "#E8B84B";
const MUTED    = "var(--s-muted)";
const DIM      = "var(--s-dim)";
const BORDER   = "var(--s-border)";
const MONO     = "'DM Mono', monospace";

function getDayKey(date) {
  return date.toISOString().split("T")[0];
}

/* Calculates completed / expected over the last 30 days */
export default function ConsistencyScore({ habits, completions }) {
  if (!habits || habits.length === 0) return null;

  const today = new Date();
  let total = 0;
  let done = 0;

  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = getDayKey(d);
    habits.forEach((h) => {
      total++;
      if (completions[key] && completions[key][h.id]) done++;
    });
  }

  const score = total > 0 ? Math.round((done / total) * 100) : 0;
  const label =
    score >= 80 ? "Excellent" :
    score >= 60 ? "Consistent" :
    score >= 40 ? "Building" :
    score >  0  ? "Starting"  :
    "No data yet";

  const scoreColor =
    score >= 60 ? ACCENT3 :
    score >= 40 ? GOLD3   :
    MUTED;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "1.25rem",
        padding: "0.85rem 1.1rem",
        background: "rgba(246,241,232,0.025)",
        border: `1px solid ${BORDER}`,
        borderRadius: "10px",
        marginTop: "1.1rem",
        maxWidth: "480px",
        animation: "fadeIn 0.4s ease",
      }}
    >
      <div style={{ flexShrink: 0 }}>
        <div
          style={{
            fontFamily: MONO,
            fontSize: "22px",
            color: scoreColor,
            lineHeight: 1,
          }}
        >
          {score}%
        </div>
        <div
          style={{
            fontSize: "9px",
            fontWeight: 500,
            letterSpacing: "2px",
            textTransform: "uppercase",
            color: DIM,
            marginTop: "3px",
          }}
        >
          {label}
        </div>
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "10px", color: DIM, marginBottom: "6px" }}>
          30-day consistency
        </div>
        <div
          style={{
            height: "2px",
            background: "rgba(246,241,232,0.07)",
            borderRadius: "2px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${score}%`,
              background: `linear-gradient(90deg, ${ACCENT2}, ${ACCENT3})`,
              borderRadius: "2px",
              transition: "width 0.8s ease",
            }}
          />
        </div>
      </div>
    </div>
  );
}
