"use client";

/* ── Design Tokens (match landing page :root) ── */
const PARCHMENT = "var(--s-text)";
const ACCENT3   = "#5A9E72";
const GOLD3     = "#E8B84B";
const MUTED     = "var(--s-muted)";
const DIM       = "var(--s-dim)";
const BORDER    = "var(--s-border)";
const SANS      = "'DM Sans', sans-serif";
const MONO      = "'DM Mono', monospace";

function getDayKey(date) {
  return date.toISOString().split("T")[0];
}

function getWeeklyRate(habitId, completions, date) {
  let done = 0;
  const d = new Date(date);
  for (let i = 0; i < 7; i++) {
    const key = getDayKey(d);
    if (completions[key] && completions[key][habitId]) done++;
    d.setDate(d.getDate() - 1);
  }
  return done / 7;
}

export default function SuggestionPanel({ habits, completions, date, onNavigate }) {
  if (!habits || habits.length === 0) return null;

  const card = {
    background: "rgba(246,241,232,0.025)",
    border: `1px solid ${BORDER}`,
    borderRadius: "8px",
    padding: "0.85rem 1rem",
  };

  const rates = habits.map((h) => ({
    habit: h,
    rate: getWeeklyRate(h.id, completions, date),
  }));

  const sorted = [...rates].sort((a, b) => a.rate - b.rate);
  const weakest  = sorted[0];
  const strongest = sorted[sorted.length - 1];

  let suggestion = "Focus on one habit at a time. Consistency beats volume.";
  if (weakest && weakest.rate < 0.5) {
    suggestion = `Consider attaching "${weakest.habit.name}" to an existing habit as its cue.`;
  } else if (strongest && strongest.rate >= 0.8) {
    suggestion = `"${strongest.habit.name}" is your anchor. Build your stack around it.`;
  }

  const showBoth = weakest && strongest && weakest.habit.id !== strongest.habit.id;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <div
        style={{
          fontSize: "9px",
          fontWeight: 500,
          letterSpacing: "2.5px",
          textTransform: "uppercase",
          color: GOLD3,
          marginBottom: "2px",
        }}
      >
        Guidance
      </div>

      {/* Most consistent */}
      {strongest && (
        <div style={card}>
          <div
            style={{
              fontSize: "9px",
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              color: ACCENT3,
              marginBottom: "4px",
            }}
          >
            Most consistent
          </div>
          <div style={{ fontSize: "13px", color: PARCHMENT }}>
            {strongest.habit.name}
          </div>
          <div style={{ fontFamily: MONO, fontSize: "10px", color: DIM, marginTop: "2px" }}>
            {Math.round(strongest.rate * 100)}% this week
          </div>
        </div>
      )}

      {/* Needs attention */}
      {showBoth && (
        <div style={card}>
          <div
            style={{
              fontSize: "9px",
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              color: MUTED,
              marginBottom: "4px",
            }}
          >
            Needs attention
          </div>
          <div style={{ fontSize: "13px", color: PARCHMENT }}>
            {weakest.habit.name}
          </div>
          <div style={{ fontFamily: MONO, fontSize: "10px", color: DIM, marginTop: "2px" }}>
            {Math.round(weakest.rate * 100)}% this week
          </div>
        </div>
      )}

      {/* Suggestion */}
      <div
        style={{
          padding: "0.85rem 1rem",
          borderLeft: "2px solid rgba(90,158,114,0.2)",
        }}
      >
        <p style={{ fontSize: "12px", color: MUTED, lineHeight: 1.65 }}>
          {suggestion}
        </p>
        <button
          onClick={() => onNavigate("intention")}
          style={{
            marginTop: "0.6rem",
            background: "none",
            border: "none",
            color: ACCENT3,
            fontFamily: SANS,
            fontSize: "11px",
            cursor: "pointer",
            padding: 0,
            letterSpacing: "0.3px",
            transition: "color 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = PARCHMENT)}
          onMouseLeave={(e) => (e.currentTarget.style.color = ACCENT3)}
        >
          Set an intention
        </button>
      </div>
    </div>
  );
}
