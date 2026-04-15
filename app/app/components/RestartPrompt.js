"use client";

/* ── Design Tokens (match landing page :root) ── */
const PARCHMENT = "var(--s-text)";
const DIM       = "var(--s-dim)";
const MUTED     = "var(--s-muted)";
const BORDER2   = "var(--s-border2)";
const SANS      = "'DM Sans', sans-serif";

/*
  Props:
    missedHabits : [{ habit, daysMissed }]
    dismissed    : { [habitId]: true }
    onDismiss    : (habitId) => void
    onAdjust     : (habitId, action) => void   action: 'reduce' | 'move' | 'attach'
*/
export default function RestartPrompt({ missedHabits, dismissed, onDismiss, onAdjust }) {
  const visible = (missedHabits || []).filter((m) => !dismissed?.[m.habit.id]);
  if (visible.length === 0) return null;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        marginBottom: "1.5rem",
        animation: "slideUp 0.3s ease",
      }}
    >
      {visible.map(({ habit, daysMissed }) => (
        <div
          key={habit.id}
          style={{
            background: "rgba(22,20,15,0.7)",
            border: "1px solid rgba(246,241,232,0.1)",
            borderLeft: "2px solid rgba(232,184,75,0.35)",
            borderRadius: "10px",
            padding: "1rem 1.1rem",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "0.6rem",
            }}
          >
            <div>
              <div style={{ fontSize: "12px", color: PARCHMENT, marginBottom: "2px" }}>
                {habit.name}
              </div>
              <div style={{ fontSize: "11px", color: MUTED }}>
                Missed {daysMissed} day{daysMissed > 1 ? "s" : ""}. You slipped. Reset and continue.
              </div>
            </div>
            <button
              onClick={() => onDismiss(habit.id)}
              style={{
                background: "none",
                border: "none",
                color: DIM,
                cursor: "pointer",
                fontSize: "15px",
                lineHeight: 1,
                padding: "0 2px",
                transition: "color 0.15s",
                flexShrink: 0,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = PARCHMENT)}
              onMouseLeave={(e) => (e.currentTarget.style.color = DIM)}
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {[
              { key: "reduce", label: "Reduce difficulty" },
              { key: "move",   label: "Change time slot"  },
              { key: "attach", label: "Attach to a habit" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => {
                  onAdjust(habit.id, key);
                  onDismiss(habit.id);
                }}
                style={{
                  padding: "0.35rem 0.85rem",
                  background: "transparent",
                  border: `1px solid ${BORDER2}`,
                  borderRadius: "50px",
                  color: MUTED,
                  fontFamily: SANS,
                  fontSize: "11px",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  letterSpacing: "0.2px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(246,241,232,0.28)";
                  e.currentTarget.style.color = PARCHMENT;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = BORDER2;
                  e.currentTarget.style.color = MUTED;
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
