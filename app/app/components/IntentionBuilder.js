"use client";

import { useState } from "react";
import { insertIntentionDb, updateIntentionDb, deleteIntentionDb } from "@/lib/db";

/* ── Design Tokens (match landing page :root) ── */
const INK       = "var(--s-bg)";
const PARCHMENT = "var(--s-text)";
const ACCENT    = "#1E4D30";
const ACCENT2   = "#2F6B43";
const ACCENT3   = "#5A9E72";
const GOLD3     = "#E8B84B";
const MUTED     = "var(--s-muted)";
const DIM       = "var(--s-dim)";
const BORDER    = "var(--s-border)";
const BORDER2   = "var(--s-border2)";
const FAINT     = "var(--s-faint)";
const SERIF     = "'Cormorant Garamond', serif";
const SANS      = "'DM Sans', sans-serif";
const MONO      = "'DM Mono', monospace";

const HOURS   = [1,2,3,4,5,6,7,8,9,10,11,12];
const MINUTES = ["00","15","30","45"];

const LOCATIONS = ["home", "the gym", "my desk", "the kitchen", "outside", "the office"];

/* ── Parses a stored time string like "10:30am" → { h:10, m:"30", ampm:"am" } ── */
function parseTimeStr(str) {
  if (!str) return { h: null, m: null, ampm: "am" };
  const match = str.match(/^(\d{1,2}):(\d{2})(am|pm)$/i);
  if (!match) return { h: null, m: null, ampm: "am" };
  return { h: parseInt(match[1], 10), m: match[2], ampm: match[3].toLowerCase() };
}

function formatTimeStr(h, m, ampm) {
  if (!h || !m) return "";
  return `${h}:${m}${ampm}`;
}

/* ── Inline time picker: hour + minute + AM/PM ── */
function TimePicker({ value, onChange }) {
  const parsed = parseTimeStr(value);
  const [h, setH]         = useState(parsed.h);
  const [m, setM]         = useState(parsed.m);
  const [ampm, setAmpm]   = useState(parsed.ampm);

  function pick(newH, newM, newAmpm) {
    const nh = newH !== undefined ? newH : h;
    const nm = newM !== undefined ? newM : m;
    const na = newAmpm !== undefined ? newAmpm : ampm;
    setH(nh); setM(nm); setAmpm(na);
    if (nh && nm) onChange(formatTimeStr(nh, nm, na));
  }

  const miniChip = (active) => ({
    padding: "0.35rem 0.7rem",
    border: `1px solid ${active ? ACCENT3 : BORDER2}`,
    borderRadius: "6px",
    background: active ? "rgba(90,158,114,0.12)" : "transparent",
    color: active ? PARCHMENT : MUTED,
    fontFamily: MONO,
    fontSize: "12px",
    cursor: "pointer",
    transition: "all 0.12s",
    letterSpacing: "0.3px",
  });

  const ampmBtn = (active) => ({
    padding: "0.4rem 1rem",
    border: `1px solid ${active ? ACCENT3 : BORDER2}`,
    borderRadius: "6px",
    background: active ? "rgba(90,158,114,0.12)" : "transparent",
    color: active ? PARCHMENT : MUTED,
    fontFamily: SANS,
    fontSize: "12px",
    fontWeight: active ? 500 : 400,
    cursor: "pointer",
    transition: "all 0.12s",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {/* AM / PM */}
      <div style={{ display: "flex", gap: "6px" }}>
        <button style={ampmBtn(ampm === "am")} onClick={() => pick(undefined, undefined, "am")}>AM</button>
        <button style={ampmBtn(ampm === "pm")} onClick={() => pick(undefined, undefined, "pm")}>PM</button>
      </div>

      {/* Hours */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
        {HOURS.map((n) => (
          <button key={n} style={miniChip(h === n)} onClick={() => pick(n, undefined, undefined)}>
            {n}
          </button>
        ))}
      </div>

      {/* Minutes */}
      <div style={{ display: "flex", gap: "5px" }}>
        {MINUTES.map((n) => (
          <button key={n} style={miniChip(m === n)} onClick={() => pick(undefined, n, undefined)}>
            :{n}
          </button>
        ))}
      </div>

      {/* Live preview */}
      {h && m && (
        <div style={{ fontFamily: MONO, fontSize: "18px", color: ACCENT3, letterSpacing: "1px", marginTop: "2px" }}>
          {h}:{m} {ampm.toUpperCase()}
        </div>
      )}
    </div>
  );
}

const label9 = {
  fontSize: "9px",
  fontWeight: 500,
  letterSpacing: "2.5px",
  textTransform: "uppercase",
  color: GOLD3,
  marginBottom: "0.75rem",
};

const chip = (active) => ({
  padding: "0.4rem 1rem",
  border: `1px solid ${active ? ACCENT3 : BORDER2}`,
  borderRadius: "50px",
  background: active ? "rgba(90,158,114,0.12)" : "transparent",
  color: active ? PARCHMENT : MUTED,
  fontFamily: SANS,
  fontSize: "12px",
  cursor: "pointer",
  transition: "all 0.15s",
  letterSpacing: "0.2px",
});

const btn = (primary) => ({
  padding: "0.65rem 1.5rem",
  background: primary ? ACCENT : "transparent",
  border: `1px solid ${primary ? ACCENT2 : BORDER2}`,
  borderRadius: "8px",
  color: primary ? PARCHMENT : MUTED,
  fontFamily: SANS,
  fontSize: "13px",
  cursor: "pointer",
  transition: "all 0.2s",
  letterSpacing: "0.2px",
});

/* ── Edit Intention Modal ── */
function EditIntentionModal({ intention, habits, onSave, onClose }) {
  const [time, setTime]         = useState(intention.time);
  const [habitId, setHabitId]   = useState(intention.habitId);
  const [location, setLocation] = useState(
    LOCATIONS.includes(intention.location) ? intention.location : "__custom__"
  );
  const [locInput, setLocInput] = useState(
    LOCATIONS.includes(intention.location) ? "" : intention.location
  );

  const selectedHabit = habits.find((h) => h.id === habitId);
  const finalLocation = location === "__custom__" ? locInput : location;
  const sentence =
    time && selectedHabit && finalLocation
      ? `When it is ${time}, I will ${selectedHabit.name.toLowerCase()} at ${finalLocation}.`
      : null;

  function submit() {
    if (!sentence) return;
    onSave({
      ...intention,
      time,
      habitId,
      habitName: selectedHabit.name,
      location: finalLocation,
      sentence,
    });
  }

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(22,20,15,0.78)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 300,
        animation: "fadeIn 0.18s ease",
      }}
    >
      <div
        style={{
          background: "var(--s-bg2)",
          border: `1px solid ${BORDER2}`,
          borderRadius: "16px",
          padding: "2rem 2.25rem 2.25rem",
          width: "min(520px, 93vw)",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
          animation: "slideUp 0.22s ease",
          position: "relative",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.75rem" }}>
          <div>
            <p style={{ fontSize: "9px", fontWeight: 500, letterSpacing: "2.5px", textTransform: "uppercase", color: GOLD3, marginBottom: "5px" }}>
              Edit Intention
            </p>
            <h2 style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: "22px", fontWeight: 400, color: PARCHMENT, lineHeight: 1.2 }}>
              Update your plan
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: DIM, cursor: "pointer", fontSize: "20px", lineHeight: 1, padding: "2px 4px", transition: "color 0.15s" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = PARCHMENT)}
            onMouseLeave={(e) => (e.currentTarget.style.color = DIM)}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.4rem" }}>
          {/* Time */}
          <div>
            <div style={{ ...label9, marginBottom: "10px" }}>When</div>
            <TimePicker value={time} onChange={setTime} />
          </div>

          {/* Habit */}
          <div>
            <div style={{ ...label9, marginBottom: "8px" }}>What</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              {habits.map((h) => (
                <button
                  key={h.id}
                  onClick={() => setHabitId(h.id)}
                  style={{ ...chip(habitId === h.id), textAlign: "left", borderRadius: "8px", padding: "0.6rem 1rem" }}
                >
                  {h.name}
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div>
            <div style={{ ...label9, marginBottom: "8px" }}>Where</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "8px" }}>
              {LOCATIONS.map((loc) => (
                <button key={loc} onClick={() => { setLocation(loc); setLocInput(""); }} style={chip(location === loc)}>{loc}</button>
              ))}
              <button onClick={() => setLocation("__custom__")} style={chip(location === "__custom__")}>other…</button>
            </div>
            {location === "__custom__" && (
              <input
                type="text"
                value={locInput}
                onChange={(e) => setLocInput(e.target.value)}
                placeholder="e.g. the park"
                style={{ width: "100%", background: FAINT, border: `1px solid ${BORDER2}`, borderRadius: "8px", padding: "0.65rem 1rem", color: PARCHMENT, fontFamily: SANS, fontSize: "13px", outline: "none", boxSizing: "border-box" }}
              />
            )}
          </div>

          {/* Preview */}
          {sentence && (
            <div style={{ padding: "1rem 1.25rem", background: "rgba(30,77,48,0.12)", borderLeft: `2px solid ${ACCENT2}`, borderRadius: "6px" }}>
              <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: "15px", color: PARCHMENT, lineHeight: 1.6, margin: 0 }}>
                &ldquo;{sentence}&rdquo;
              </p>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", paddingTop: "0.25rem" }}>
            <button
              onClick={onClose}
              style={{ padding: "0.65rem 1.25rem", background: "transparent", border: `1px solid ${BORDER2}`, borderRadius: "50px", color: MUTED, fontFamily: SANS, fontSize: "13px", cursor: "pointer", transition: "all 0.15s" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(246,241,232,0.28)"; e.currentTarget.style.color = PARCHMENT; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = BORDER2; e.currentTarget.style.color = MUTED; }}
            >
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={!sentence}
              style={{ padding: "0.65rem 1.75rem", background: sentence ? ACCENT : "rgba(246,241,232,0.04)", border: `1px solid ${sentence ? ACCENT2 : "rgba(246,241,232,0.08)"}`, borderRadius: "50px", color: sentence ? PARCHMENT : DIM, fontFamily: SANS, fontSize: "13px", fontWeight: 500, cursor: sentence ? "pointer" : "default", transition: "background 0.2s", boxShadow: sentence ? "0 4px 20px rgba(30,77,48,0.25)" : "none" }}
              onMouseEnter={(e) => sentence && (e.currentTarget.style.background = ACCENT2)}
              onMouseLeave={(e) => sentence && (e.currentTarget.style.background = ACCENT)}
            >
              Save changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Props: { habits, intentions, setIntentions, userId, onCalendarSync, onError } */
export default function IntentionBuilderView({ habits, intentions, setIntentions, userId, onCalendarSync, onError }) {
  const [step, setStep] = useState(1);
  const [time, setTime]         = useState("");
  const [habitId, setHabitId]   = useState("");
  const [location, setLocation] = useState("");
  const [locInput, setLocInput] = useState("");
  const [saved, setSaved]       = useState(false);
  const [editing, setEditing]   = useState(null); // the intention being edited

  // Calendar sync panel state
  const [calPanelId, setCalPanelId] = useState(null);
  const [calDur, setCalDur]         = useState(30);
  const [calFreq, setCalFreq]       = useState("DAILY");
  const [calSyncing, setCalSyncing] = useState(false);

  async function submitCalSync(intentionId) {
    if (!onCalendarSync || calSyncing) return;
    setCalSyncing(true);
    try {
      await onCalendarSync(intentionId, "create", { duration: calDur, frequency: calFreq });
      setCalPanelId(null);
    } catch (err) {
      if (onError) onError(err, "Intention calendar sync");
    } finally {
      setCalSyncing(false);
    }
  }

  async function removeCalSync(intentionId) {
    if (!onCalendarSync) return;
    try {
      await onCalendarSync(intentionId, "delete", {});
    } catch (err) {
      if (onError) onError(err, "Intention calendar remove");
    }
  }

  const selectedHabit = habits.find((h) => h.id === habitId);
  const finalLocation = location === "__custom__" ? locInput : location;

  const sentence =
    time && selectedHabit && finalLocation
      ? `When it is ${time}, I will ${selectedHabit.name.toLowerCase()} at ${finalLocation}.`
      : null;

  function save() {
    if (!sentence) return;
    const entry = {
      id: Date.now().toString(),
      time,
      habitId,
      habitName: selectedHabit.name,
      location: finalLocation,
      sentence,
      createdAt: new Date().toISOString(),
    };
    const next = [entry, ...intentions];
    setIntentions(next);
    if (userId) insertIntentionDb(userId, entry);
    setSaved(true);
    // Reset for next entry
    setTimeout(() => {
      setStep(1); setTime(""); setHabitId("");
      setLocation(""); setLocInput(""); setSaved(false);
    }, 2200);
  }

  return (
    <div style={{ maxWidth: "600px", animation: "fadeIn 0.3s ease" }}>
      {/* Edit modal */}
      {editing && (
        <EditIntentionModal
          intention={editing}
          habits={habits}
          onSave={(updated) => {
            const next = intentions.map((x) => x.id === updated.id ? updated : x);
            setIntentions(next);
            if (userId) updateIntentionDb(userId, updated);
            setEditing(null);
          }}
          onClose={() => setEditing(null)}
        />
      )}
      {/* Header */}
      <div style={{ marginBottom: "2.25rem" }}>
        <div style={label9}>Guidance &rsaquo; Implementation</div>
        <h2
          style={{
            fontFamily: SERIF,
            fontSize: "28px",
            fontWeight: 400,
            color: PARCHMENT,
            marginBottom: "0.4rem",
          }}
        >
          Implementation Intention
        </h2>
        <p style={{ fontSize: "13px", color: MUTED, lineHeight: 1.65 }}>
          Research shows that specifying when, what, and where you will act dramatically
          increases follow-through. Complete the sentence below.
        </p>
      </div>

      {/* Step indicators */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "2rem" }}>
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            style={{
              height: "2px",
              flex: 1,
              borderRadius: "1px",
              background: step >= s ? ACCENT3 : FAINT,
              transition: "background 0.3s",
            }}
          />
        ))}
      </div>

      {/* Step 1: Time */}
      {step === 1 && (
        <div style={{ animation: "slideUp 0.25s ease" }}>
          <div style={label9}>Step 1 &mdash; When</div>
          <p style={{ fontSize: "13px", color: MUTED, marginBottom: "1.25rem" }}>
            Choose a specific time of day.
          </p>
          <TimePicker value={time} onChange={setTime} />
          <div style={{ marginTop: "1.75rem" }}>
            <button
              onClick={() => time && setStep(2)}
              disabled={!time}
              style={{ ...btn(true), opacity: time ? 1 : 0.4 }}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Habit */}
      {step === 2 && (
        <div style={{ animation: "slideUp 0.25s ease" }}>
          <div style={label9}>Step 2 &mdash; What</div>
          <p style={{ fontSize: "13px", color: MUTED, marginBottom: "1.25rem" }}>
            Which habit will you perform?
          </p>
          {habits.length === 0 ? (
            <p style={{ fontSize: "13px", color: DIM }}>
              No habits yet. Add one in the Habits section first.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "1.75rem" }}>
              {habits.map((h) => (
                <button
                  key={h.id}
                  onClick={() => setHabitId(h.id)}
                  style={{
                    ...chip(habitId === h.id),
                    textAlign: "left",
                    borderRadius: "8px",
                    padding: "0.65rem 1rem",
                  }}
                >
                  {h.name}
                  {h.timeSlot ? (
                    <span style={{ fontSize: "10px", color: DIM, marginLeft: "8px" }}>
                      {h.timeSlot}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          )}
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={() => setStep(1)} style={btn(false)}>Back</button>
            <button
              onClick={() => habitId && setStep(3)}
              disabled={!habitId}
              style={{ ...btn(true), opacity: habitId ? 1 : 0.4 }}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Location */}
      {step === 3 && (
        <div style={{ animation: "slideUp 0.25s ease" }}>
          <div style={label9}>Step 3 &mdash; Where</div>
          <p style={{ fontSize: "13px", color: MUTED, marginBottom: "1.25rem" }}>
            Choose or type a location.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "1rem" }}>
            {LOCATIONS.map((loc) => (
              <button
                key={loc}
                onClick={() => { setLocation(loc); setLocInput(""); }}
                style={chip(location === loc)}
              >
                {loc}
              </button>
            ))}
            <button
              onClick={() => setLocation("__custom__")}
              style={chip(location === "__custom__")}
            >
              other…
            </button>
          </div>
          {location === "__custom__" && (
            <input
              type="text"
              value={locInput}
              onChange={(e) => setLocInput(e.target.value)}
              placeholder="e.g. the park"
              style={{
                width: "100%",
                background: FAINT,
                border: `1px solid ${BORDER2}`,
                borderRadius: "8px",
                padding: "0.65rem 1rem",
                color: PARCHMENT,
                fontFamily: SANS,
                fontSize: "13px",
                outline: "none",
                marginBottom: "0.5rem",
                boxSizing: "border-box",
              }}
            />
          )}

          {/* Preview sentence */}
          {sentence && (
            <div
              style={{
                margin: "1.5rem 0",
                padding: "1rem 1.25rem",
                background: "rgba(30,77,48,0.12)",
                borderLeft: `2px solid ${ACCENT2}`,
                borderRadius: "6px",
              }}
            >
              <p
                style={{
                  fontFamily: SERIF,
                  fontStyle: "italic",
                  fontSize: "16px",
                  color: PARCHMENT,
                  lineHeight: 1.6,
                }}
              >
                &ldquo;{sentence}&rdquo;
              </p>
            </div>
          )}

          <div style={{ display: "flex", gap: "8px", marginTop: "1rem" }}>
            <button onClick={() => setStep(2)} style={btn(false)}>Back</button>
            <button
              onClick={save}
              disabled={!sentence || saved}
              style={{
                ...btn(true),
                opacity: sentence && !saved ? 1 : 0.45,
                background: saved ? ACCENT3 : ACCENT,
              }}
            >
              {saved ? "Saved ✓" : "Save intention"}
            </button>
          </div>
        </div>
      )}

      {/* Saved intentions list */}
      {intentions.length > 0 && (
        <div style={{ marginTop: "3rem" }}>
          <div style={label9}>Saved intentions</div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              marginTop: "0.25rem",
            }}
          >
            {intentions.map((i) => (
              <div
                key={i.id}
                style={{
                  background: "rgba(246,241,232,0.025)",
                  border: `1px solid ${BORDER}`,
                  borderRadius: "8px",
                  overflow: "hidden",
                }}
              >
                {/* Main row */}
                <div style={{ padding: "0.9rem 1.1rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
                  <p
                    style={{
                      fontFamily: SERIF,
                      fontStyle: "italic",
                      fontSize: "14px",
                      color: MUTED,
                      lineHeight: 1.6,
                      margin: 0,
                    }}
                  >
                    &ldquo;{i.sentence}&rdquo;
                  </p>
                  <div style={{ display: "flex", gap: "6px", flexShrink: 0, alignItems: "center" }}>
                    {/* Google Calendar toggle button */}
                    {onCalendarSync && (
                      i.gcalEventId ? (
                        /* Already synced — show badge + remove */
                        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                          <span style={{ fontSize: "9px", letterSpacing: "1.5px", textTransform: "uppercase", color: ACCENT3 }}>Synced</span>
                          <button
                            onClick={() => removeCalSync(i.id)}
                            style={{ background: "none", border: "none", color: DIM, cursor: "pointer", fontSize: "13px", lineHeight: 1, padding: "0 2px", transition: "color 0.15s" }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(220,100,100,0.7)")}
                            onMouseLeave={(e) => (e.currentTarget.style.color = DIM)}
                            aria-label="Remove calendar sync"
                          >×</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setCalPanelId(calPanelId === i.id ? null : i.id); setCalDur(30); setCalFreq("DAILY"); }}
                          title="Add to Google Calendar"
                          style={{
                            background: calPanelId === i.id ? "rgba(90,158,114,0.12)" : "none",
                            border: `1px solid ${calPanelId === i.id ? ACCENT3 : "transparent"}`,
                            borderRadius: "5px",
                            padding: "3px 5px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            transition: "all 0.15s",
                          }}
                          onMouseEnter={(e) => { if (calPanelId !== i.id) { e.currentTarget.style.background = "rgba(246,241,232,0.06)"; }}}
                          onMouseLeave={(e) => { if (calPanelId !== i.id) { e.currentTarget.style.background = "none"; }}}
                          aria-label="Add to Google Calendar"
                        >
                          {/* Google Calendar mini icon */}
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <rect x="3" y="4" width="18" height="17" rx="2" stroke={ACCENT3} strokeWidth="1.5"/>
                            <path d="M3 9h18" stroke={ACCENT3} strokeWidth="1.5"/>
                            <path d="M8 2v4M16 2v4" stroke={ACCENT3} strokeWidth="1.5" strokeLinecap="round"/>
                          </svg>
                        </button>
                      )
                    )}
                    {/* Edit icon */}
                    <button
                      onClick={() => setEditing(i)}
                      style={{ background: "none", border: "none", color: DIM, cursor: "pointer", padding: "3px", display: "flex", alignItems: "center", transition: "color 0.15s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = PARCHMENT)}
                      onMouseLeave={(e) => (e.currentTarget.style.color = DIM)}
                      aria-label="Edit intention"
                    >
                      <svg width="13" height="13" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9.5 1.5L12.5 4.5L4.5 12.5H1.5V9.5L9.5 1.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M7.5 3.5L10.5 6.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                      </svg>
                    </button>
                    {/* Delete icon */}
                    <button
                      onClick={() => {
                        const next = intentions.filter((x) => x.id !== i.id);
                        setIntentions(next);
                        if (userId) deleteIntentionDb(userId, i.id);
                      }}
                      style={{ background: "none", border: "none", color: DIM, cursor: "pointer", fontSize: "15px", lineHeight: 1, padding: "0 2px", transition: "color 0.15s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(220,100,100,0.7)")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = DIM)}
                      aria-label="Remove"
                    >
                      ×
                    </button>
                  </div>
                </div>

                {/* Calendar sync expand panel */}
                {calPanelId === i.id && !i.gcalEventId && (
                  <div style={{
                    borderTop: `1px solid ${BORDER}`,
                    padding: "1rem 1.1rem",
                    background: "rgba(30,77,48,0.06)",
                    animation: "slideUp 0.18s ease",
                  }}>
                    <p style={{ fontSize: "9px", fontWeight: 500, letterSpacing: "2.5px", textTransform: "uppercase", color: GOLD3, marginBottom: "0.7rem" }}>
                      Add to Google Calendar
                    </p>

                    {/* Duration */}
                    <div style={{ marginBottom: "0.75rem" }}>
                      <p style={{ fontSize: "11px", color: DIM, marginBottom: "6px" }}>Duration</p>
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        {[15, 30, 45, 60].map((d) => (
                          <button
                            key={d}
                            onClick={() => setCalDur(d)}
                            style={{
                              padding: "0.3rem 0.75rem",
                              border: `1px solid ${calDur === d ? ACCENT3 : BORDER2}`,
                              borderRadius: "50px",
                              background: calDur === d ? "rgba(90,158,114,0.12)" : "transparent",
                              color: calDur === d ? PARCHMENT : MUTED,
                              fontFamily: SANS, fontSize: "12px", cursor: "pointer", transition: "all 0.12s",
                            }}
                          >{d} min</button>
                        ))}
                      </div>
                    </div>

                    {/* Repeat */}
                    <div style={{ marginBottom: "0.9rem" }}>
                      <p style={{ fontSize: "11px", color: DIM, marginBottom: "6px" }}>Repeat</p>
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        {[["DAILY","Daily"],["WEEKDAYS","Weekdays"],["WEEKLY","Weekly"]].map(([val, label]) => (
                          <button
                            key={val}
                            onClick={() => setCalFreq(val)}
                            style={{
                              padding: "0.3rem 0.75rem",
                              border: `1px solid ${calFreq === val ? ACCENT3 : BORDER2}`,
                              borderRadius: "50px",
                              background: calFreq === val ? "rgba(90,158,114,0.12)" : "transparent",
                              color: calFreq === val ? PARCHMENT : MUTED,
                              fontFamily: SANS, fontSize: "12px", cursor: "pointer", transition: "all 0.12s",
                            }}
                          >{label}</button>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() => submitCalSync(i.id)}
                        disabled={calSyncing}
                        style={{
                          padding: "0.5rem 1.25rem",
                          background: ACCENT, border: `1px solid ${ACCENT2}`,
                          borderRadius: "50px",
                          color: PARCHMENT, fontFamily: SANS, fontSize: "12px", fontWeight: 500,
                          cursor: calSyncing ? "default" : "pointer",
                          opacity: calSyncing ? 0.5 : 1,
                          transition: "background 0.2s",
                        }}
                        onMouseEnter={(e) => !calSyncing && (e.currentTarget.style.background = ACCENT2)}
                        onMouseLeave={(e) => !calSyncing && (e.currentTarget.style.background = ACCENT)}
                      >
                        {calSyncing ? "Adding…" : "Add to Calendar"}
                      </button>
                      <button
                        onClick={() => setCalPanelId(null)}
                        style={{
                          padding: "0.5rem 1rem",
                          background: "transparent", border: `1px solid ${BORDER2}`,
                          borderRadius: "50px",
                          color: MUTED, fontFamily: SANS, fontSize: "12px",
                          cursor: "pointer", transition: "all 0.15s",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(246,241,232,0.28)"; e.currentTarget.style.color = PARCHMENT; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = BORDER2; e.currentTarget.style.color = MUTED; }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
