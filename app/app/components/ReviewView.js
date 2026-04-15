"use client";

/* ── Design Tokens (match landing page :root) ── */
const PARCHMENT = "var(--s-text)";
const ACCENT3   = "#5A9E72";
const GOLD3     = "#E8B84B";
const MUTED     = "var(--s-muted)";
const DIM       = "var(--s-dim)";
const FAINT     = "var(--s-faint)";
const BORDER    = "var(--s-border)";
const SERIF     = "'Cormorant Garamond', serif";
const SANS      = "'DM Sans', sans-serif";
const MONO      = "'DM Mono', monospace";

const card = {
  background: "var(--s-card-bg)",
  border: `1px solid ${BORDER}`,
  borderRadius: "10px",
  padding: "1.1rem 1.25rem",
};

const label9 = {
  fontSize: "9px",
  fontWeight: 500,
  letterSpacing: "2.5px",
  textTransform: "uppercase",
  color: GOLD3,
  marginBottom: "0.75rem",
};

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

/* Props: { habits, completions, date } */
export default function ReviewView({ habits, completions, date }) {
  if (!habits) return null;

  // 7-day window ending today
  const rates = habits.map((h) => ({
    habit: h,
    rate: getWeeklyRate(h.id, completions, date),
    done: Math.round(getWeeklyRate(h.id, completions, date) * 7),
  }));

  const sorted = [...rates].sort((a, b) => b.rate - a.rate);
  const best    = sorted[0];
  const weakest = sorted[sorted.length - 1];

  const overall =
    rates.length > 0
      ? Math.round(rates.reduce((sum, r) => sum + r.rate, 0) / rates.length * 100)
      : 0;

  const overallLabel =
    overall >= 80 ? "Excellent week." :
    overall >= 60 ? "Solid week." :
    overall >= 40 ? "Still building." :
    overall > 0   ? "Just getting started." :
                    "No data yet.";

  return (
    <div style={{ maxWidth: "640px", animation: "fadeIn 0.3s ease" }}>
      {/* Header */}
      <div style={{ marginBottom: "2.25rem" }}>
        <div style={label9}>Guidance &rsaquo; Weekly Review</div>
        <h2
          style={{
            fontFamily: SERIF,
            fontSize: "28px",
            fontWeight: 400,
            color: PARCHMENT,
            marginBottom: "0.4rem",
          }}
        >
          This Week
        </h2>
        <p style={{ fontSize: "13px", color: MUTED }}>{overallLabel}</p>
      </div>

      {/* Overall score */}
      <div
        style={{
          ...card,
          display: "flex",
          alignItems: "center",
          gap: "1.5rem",
          marginBottom: "1.25rem",
        }}
      >
        <div>
          <div
            style={{
              fontFamily: MONO,
              fontSize: "36px",
              color: overall >= 60 ? ACCENT3 : overall >= 40 ? GOLD3 : MUTED,
              lineHeight: 1,
            }}
          >
            {overall}%
          </div>
          <div style={{ fontSize: "10px", color: DIM, marginTop: "4px" }}>7-day consistency</div>
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              height: "4px",
              background: FAINT,
              borderRadius: "2px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${overall}%`,
                background: `linear-gradient(90deg, #2F6B43, ${ACCENT3})`,
                borderRadius: "2px",
                transition: "width 0.8s ease",
              }}
            />
          </div>
        </div>
      </div>

      {/* Best / Weakest */}
      {habits.length >= 2 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "1.25rem" }}>
          {best && (
            <div style={card}>
              <div
                style={{
                  fontSize: "9px",
                  letterSpacing: "1.5px",
                  textTransform: "uppercase",
                  color: ACCENT3,
                  marginBottom: "6px",
                }}
              >
                Best this week
              </div>
              <div style={{ fontSize: "14px", color: PARCHMENT, marginBottom: "3px" }}>
                {best.habit.name}
              </div>
              <div style={{ fontFamily: MONO, fontSize: "11px", color: DIM }}>
                {best.done}/7 days
              </div>
            </div>
          )}
          {weakest && weakest.habit.id !== best?.habit.id && (
            <div style={card}>
              <div
                style={{
                  fontSize: "9px",
                  letterSpacing: "1.5px",
                  textTransform: "uppercase",
                  color: MUTED,
                  marginBottom: "6px",
                }}
              >
                Most missed
              </div>
              <div style={{ fontSize: "14px", color: PARCHMENT, marginBottom: "3px" }}>
                {weakest.habit.name}
              </div>
              <div style={{ fontFamily: MONO, fontSize: "11px", color: DIM }}>
                {weakest.done}/7 days
              </div>
            </div>
          )}
        </div>
      )}

      {/* Per-habit breakdown */}
      {habits.length > 0 && (
        <div style={card}>
          <div style={label9}>Habit breakdown</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {sorted.map(({ habit, done, rate }) => (
              <div key={habit.id}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "5px",
                  }}
                >
                  <span style={{ fontSize: "12px", color: MUTED }}>{habit.name}</span>
                  <span style={{ fontFamily: MONO, fontSize: "11px", color: DIM }}>
                    {done}/7
                  </span>
                </div>
                <div
                  style={{
                    height: "3px",
                    background: FAINT,
                    borderRadius: "2px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${Math.round(rate * 100)}%`,
                      background: rate >= 0.6 ? ACCENT3 : rate >= 0.4 ? GOLD3 : MUTED,
                      borderRadius: "2px",
                      transition: "width 0.6s ease",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {habits.length === 0 && (
        <p style={{ fontSize: "13px", color: DIM }}>
          Add habits to start tracking your weekly review.
        </p>
      )}

      {/* Coaching note */}
      <div
        style={{
          marginTop: "1.5rem",
          padding: "1rem 1.25rem",
          borderLeft: "2px solid rgba(90,158,114,0.2)",
        }}
      >
        <p style={{ fontSize: "12px", color: DIM, lineHeight: 1.7 }}>
          {overall >= 80
            ? "You're performing at a high level. Consider adding one new habit or increasing the challenge of an existing one."
            : overall >= 60
            ? "Good baseline. Identify the one habit that failed most and make it easier for next week."
            : overall >= 40
            ? "You're in the building phase. Protect your strongest habit and reduce friction on the weakest one."
            : "Start over. Pick one habit only, make it very easy, and track it every day for seven days."}
        </p>
      </div>
    </div>
  );
}
