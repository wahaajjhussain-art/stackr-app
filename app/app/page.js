"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import {
  fetchHabits, insertHabit, deleteHabitDb, updateHabitDb,
  fetchCompletions, toggleCompletionDb,
  fetchPrefs, upsertPrefs,
  fetchIntentions, insertIntentionDb, updateIntentionDb, deleteIntentionDb,
  fetchNotes, insertNoteDb,
  resetAllDb,
} from "@/lib/db";
import ConsistencyScore from "./components/ConsistencyScore";
import SuggestionPanel from "./components/SuggestionPanel";
import RestartPrompt from "./components/RestartPrompt";
import IntentionBuilderView from "./components/IntentionBuilder";
import ReviewView from "./components/ReviewView";

/* ═══════════════════════════════════════════════
   STACKR — Dashboard
   Design system: matches landing page exactly
   ═══════════════════════════════════════════════ */

/* ── Design Tokens — resolved via CSS custom properties so theme-switching works ── */
const INK        = "var(--s-bg)";
const INK2       = "var(--s-bg2)";
const INK3       = "#524E46";
const INK4       = "#8A857C";
const PARCHMENT  = "var(--s-text)";
const PARCHMENT2 = "#EEE8DC";
const BORDER     = "var(--s-border)";
const BORDER2    = "var(--s-border2)";
const ACCENT     = "#1E4D30";
const ACCENT2    = "#2F6B43";
const ACCENT3    = "#5A9E72";
const GOLD       = "#9A6B1E";
const GOLD3      = "#E8B84B";
const MUTED      = "var(--s-muted)";
const DIM        = "var(--s-dim)";
const FAINT      = "var(--s-faint)";

/* ── Typography helpers ── */
const SERIF = "'Cormorant Garamond', serif";
const SANS  = "'DM Sans', sans-serif";
const MONO  = "'DM Mono', monospace";

/* ── Shared style objects ── */
const card = {
  background: "var(--s-card-bg)",
  border: `1px solid ${BORDER}`,
  borderRadius: "12px",
  padding: "1.5rem",
};

const inputBase = {
  width: "100%",
  padding: "0.65rem 0.9rem",
  background: "var(--s-input-bg)",
  border: "1px solid var(--s-input-border)",
  borderRadius: "8px",
  color: PARCHMENT,
  fontFamily: SANS,
  fontSize: "13px",
  outline: "none",
  transition: "border-color 0.2s",
};

/* ── Utility ── */
function getDayKey(date) {
  return date.toISOString().split("T")[0];
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

const TIME_SLOTS = ["Morning", "Afternoon", "Evening"];

const QUOTES = [
  "Every action you take is a vote for the type of person you wish to become.",
  "We become what we repeatedly do.",
  "Small habits don't add up — they compound.",
  "The secret of your future is hidden in your daily routine.",
  "You do not rise to the level of your goals. You fall to the level of your systems.",
  "First forget inspiration. Habit is more dependable.",
  "Watch your actions, they become your habits.",
  "Successful people are simply those with successful habits.",
];

/* ════════════════════════════════════════════════════
   NAV ITEMS
   ════════════════════════════════════════════════════ */
const NAV_SECTIONS = [
  {
    label: null,
    items: [{ id: "dashboard", label: "Dashboard" }],
  },
  {
    label: "Habits",
    items: [
      { id: "all-habits", label: "All Habits" },
    ],
  },
  {
    label: "Tracker",
    items: [
      { id: "monthly", label: "Monthly View" },
      { id: "daily", label: "Daily View" },
    ],
  },
  {
    label: null,
    items: [{ id: "stacking", label: "Stacking" }],
  },
  {
    label: null,
    items: [{ id: "analytics", label: "Analytics" }],
  },
  {
    label: "Guidance",
    items: [
      { id: "intention", label: "Implementation" },
      { id: "review", label: "Review" },
    ],
  },
];

/* ════════════════════════════════════════════════════
   SIDEBAR
   ════════════════════════════════════════════════════ */
function Sidebar({ active, setActive }) {
  return (
    <aside
      style={{
        width: "210px",
        flexShrink: 0,
        borderRight: `1px solid ${BORDER}`,
        display: "flex",
        flexDirection: "column",
        padding: "2rem 0",
        position: "sticky",
        top: 0,
        height: "100vh",
        overflowY: "auto",
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: "0 1.5rem 2rem",
          borderBottom: `1px solid ${BORDER}`,
          marginBottom: "1.5rem",
        }}
      >
        <span
          style={{
            fontFamily: SERIF,
            fontStyle: "italic",
            fontSize: "20px",
            fontWeight: 400,
            color: PARCHMENT,
            letterSpacing: "0.3px",
          }}
        >
          Stackr
        </span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "0 0.75rem" }}>
        {NAV_SECTIONS.map((section, si) => (
          <div key={si} style={{ marginBottom: "1.5rem" }}>
            {section.label && (
              <div
                style={{
                  fontSize: "9px",
                  fontWeight: 500,
                  letterSpacing: "2.5px",
                  textTransform: "uppercase",
                  color: DIM,
                  padding: "0 0.75rem",
                  marginBottom: "0.4rem",
                }}
              >
                {section.label}
              </div>
            )}
            {section.items.map((item) => {
              const isActive = active === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActive(item.id)}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "0.5rem 0.75rem",
                    borderRadius: "6px",
                    background: isActive ? "var(--s-faint)" : "transparent",
                    border: "none",
                    color: isActive ? PARCHMENT : MUTED,
                    fontFamily: SANS,
                    fontSize: "13px",
                    fontWeight: isActive ? 500 : 400,
                    cursor: "pointer",
                    transition: "all 0.15s",
                    letterSpacing: "0.1px",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.color = PARCHMENT;
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.color = MUTED;
                  }}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

    </aside>
  );
}

/* ════════════════════════════════════════════════════
   PROGRESS BAR
   ════════════════════════════════════════════════════ */
function ProgressBar({ pct }) {
  return (
    <div style={{ width: "100%" }}>
      <div
        style={{
          height: "3px",
          background: "var(--s-faint)",
          borderRadius: "2px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${ACCENT2}, ${ACCENT3})`,
            borderRadius: "2px",
            transition: "width 0.6s ease",
          }}
        />
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════
   HABIT TOGGLE ROW
   ════════════════════════════════════════════════════ */
function HabitRow({ habit, done, streak, onToggle }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="habit-row"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.875rem",
        padding: "0.75rem 1rem",
        borderRadius: "8px",
        border: `1px solid ${done ? "rgba(90,158,114,0.25)" : BORDER}`,
        background: done
          ? "rgba(30,77,48,0.12)"
          : hovered
          ? FAINT
          : "transparent",
        cursor: "pointer",
        transition: "all 0.18s",
        userSelect: "none",
      }}
      onClick={onToggle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Check circle */}
      <div
        style={{
          width: "20px",
          height: "20px",
          borderRadius: "50%",
          border: `1.5px solid ${done ? ACCENT3 : "var(--s-subtle)"}`,  
          background: done ? ACCENT : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          transition: "all 0.18s",
        }}
      >
        {done && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4l2.5 2.5L9 1" stroke="#F6F1E8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>

      {/* Name */}
      <span
        style={{
          flex: 1,
          fontSize: "14px",
          color: done ? MUTED : PARCHMENT,
          textDecoration: done ? "line-through" : "none",
          textDecorationColor: "var(--s-dim)",
          transition: "color 0.18s",
          letterSpacing: "0.1px",
        }}
      >
        {habit.name}
      </span>

      {/* Streak */}
      <span
        style={{
          fontSize: "11px",
          fontFamily: MONO,
          color: streak > 0 ? GOLD3 : DIM,
          letterSpacing: "0.5px",
        }}
      >
        {streak > 0 ? `${streak}d` : "—"}
      </span>
    </div>
  );
}

/* ════════════════════════════════════════════════════
   MINI CALENDAR (monthly overview)
   ════════════════════════════════════════════════════ */
function MiniCalendar({ completions, allHabits, date }) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = new Date(year, month, 1).getDay();
  const todayKey = getDayKey(date);
  const habitCount = allHabits.length || 1;

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const dayLabels = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: "1rem",
        }}
      >
        <span
          style={{
            fontFamily: SERIF,
            fontStyle: "italic",
            fontSize: "16px",
            fontWeight: 400,
            color: PARCHMENT,
          }}
        >
          {monthNames[month]}
        </span>
        <span style={{ fontFamily: MONO, fontSize: "11px", color: DIM }}>
          {year}
        </span>
      </div>

      {/* Day labels */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: "3px",
          marginBottom: "4px",
        }}
      >
        {dayLabels.map((d) => (
          <div
            key={d}
            style={{
              textAlign: "center",
              fontSize: "9px",
              fontFamily: MONO,
              color: DIM,
              letterSpacing: "0.5px",
              padding: "2px 0",
            }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: "3px",
        }}
      >
        {cells.map((day, i) => {
          if (!day)
            return (
              <div key={`e-${i}`} style={{ aspectRatio: "1" }} />
            );
          const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isToday = key === todayKey;
          const isFuture = key > todayKey;
          const doneCount = completions[key] ? Object.keys(completions[key]).filter(Boolean).length : 0;
          const fill = isFuture ? 0 : habitCount > 0 ? doneCount / habitCount : 0;

          let bg = "var(--s-faint)";
          if (isToday) bg = GOLD3;
          else if (!isFuture && fill >= 1) bg = "rgba(47,107,67,0.90)";
          else if (!isFuture && fill >= 0.5) bg = "rgba(47,107,67,0.55)";
          else if (!isFuture && fill > 0) bg = "rgba(30,77,48,0.35)";

          return (
            <div
              key={key}
              style={{
                aspectRatio: "1",
                borderRadius: "3px",
                background: bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "8px",
                fontFamily: MONO,
                color: isToday ? "#1C1A14" : "var(--s-dim)",
                fontWeight: isToday ? 500 : 400,
                transition: "background 0.2s",
              }}
            >
              {day}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════
   HEATMAP (yearly — analytics)
   ════════════════════════════════════════════════════ */
function YearHeatmap({ completions, allHabits }) {
  const today = new Date();
  const year = today.getFullYear();
  const startDate = new Date(year, 0, 1);
  const habitCount = allHabits.length || 1;

  // Build 53 weeks × 7 days grid
  const weeks = [];
  let cursor = new Date(startDate);
  // Align to Sunday
  cursor.setDate(cursor.getDate() - cursor.getDay());

  for (let w = 0; w < 53; w++) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      const key = getDayKey(cursor);
      const isThisYear = cursor.getFullYear() === year;
      const isFuture = cursor > today;
      const doneCount = completions[key]
        ? Object.keys(completions[key]).filter(Boolean).length
        : 0;
      const fill = isThisYear && !isFuture && habitCount > 0 ? doneCount / habitCount : 0;
      week.push({ key, fill, isThisYear, isFuture });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }

  const monthLabels = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  return (
    <div>
      {/* Month labels */}
      <div style={{ display: "flex", gap: "2px", marginBottom: "6px", paddingLeft: "24px" }}>
        {monthLabels.map((m, i) => (
          <div
            key={m}
            style={{
              flex: Math.round((new Date(year, i + 1, 0).getDate() / 7)),
              fontSize: "9px",
              fontFamily: MONO,
              color: DIM,
              letterSpacing: "0.3px",
              whiteSpace: "nowrap",
            }}
          >
            {m}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: "3px" }}>
        {/* Day labels */}
        <div style={{ display: "flex", flexDirection: "column", gap: "3px", marginTop: "1px" }}>
          {["","Mo","","We","","Fr",""].map((d, i) => (
            <div
              key={i}
              style={{
                height: "11px",
                fontSize: "8px",
                fontFamily: MONO,
                color: DIM,
                lineHeight: "11px",
                width: "18px",
              }}
            >
              {d}
            </div>
          ))}
        </div>
        {/* Grid */}
        <div style={{ display: "flex", gap: "3px" }}>
          {weeks.map((week, wi) => (
            <div key={wi} style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
              {week.map((cell) => {
                let bg = "var(--s-faint)";
                if (cell.isThisYear && !cell.isFuture) {
                  if (cell.fill >= 1) bg = "rgba(47,107,67,0.95)";
                  else if (cell.fill >= 0.5) bg = "rgba(47,107,67,0.55)";
                  else if (cell.fill > 0) bg = "rgba(30,77,48,0.35)";
                }
                return (
                  <div
                    key={cell.key}
                    title={cell.key}
                    style={{
                      width: "11px",
                      height: "11px",
                      borderRadius: "2px",
                      background: bg,
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════
   SETTINGS MODAL
   ════════════════════════════════════════════════════ */
function SettingsModal({ open, onClose, prefs, setPrefs, onReset, onThemeChange, session }) {
  if (!open) return null;

  function handleSignOut() {
    onClose();
    signOut({ callbackUrl: "/login" });
  }
  return (
    <div
      style={{
        position: "fixed",
        bottom: "72px",
        right: "20px",
        zIndex: 200,
        animation: "settingsDropIn 0.18s ease",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        style={{
          background: INK2,
          border: `1px solid ${BORDER2}`,
          borderRadius: "16px",
          padding: "1.5rem",
          width: "320px",
          boxShadow: "0 8px 40px rgba(0,0,0,0.45)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Account info */}
        {session?.user && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "1.25rem",
            paddingBottom: "1rem",
            borderBottom: `1px solid ${BORDER}`,
          }}>
            {session.user.image ? (
              <img
                src={session.user.image}
                alt="avatar"
                style={{ width: "38px", height: "38px", borderRadius: "50%", flexShrink: 0 }}
                referrerPolicy="no-referrer"
              />
            ) : (
              <div style={{
                width: "38px", height: "38px", borderRadius: "50%",
                background: "rgba(47,107,67,0.35)", display: "flex",
                alignItems: "center", justifyContent: "center",
                fontSize: "16px", color: PARCHMENT, flexShrink: 0,
              }}>
                {(session.user.name || "?")[0].toUpperCase()}
              </div>
            )}
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: "13px", fontWeight: 500, color: PARCHMENT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {session.user.name || "—"}
              </div>
              <div style={{ fontSize: "11px", color: DIM, marginTop: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {session.user.email || ""}
              </div>
            </div>
          </div>
        )}
        <div style={{ marginBottom: "1.25rem" }}>
          <h2
            style={{
              fontFamily: SERIF,
              fontStyle: "italic",
              fontSize: "18px",
              fontWeight: 400,
              color: PARCHMENT,
              marginBottom: "2px",
            }}
          >
            Settings
          </h2>
        </div>

        <div style={{ marginBottom: "1.25rem" }}>
          <label
            style={{
              display: "block",
              fontSize: "10px",
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "1.5px",
              color: DIM,
              marginBottom: "6px",
            }}
          >
            Your name
          </label>
          <input
            style={inputBase}
            value={prefs.name}
            onChange={(e) => setPrefs({ ...prefs, name: e.target.value })}
            placeholder="e.g. Marcus"
          />
        </div>

        {/* Theme toggle */}
        <div style={{ marginBottom: "1.5rem" }}>
          <label
            style={{
              display: "block",
              fontSize: "10px",
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "1.5px",
              color: DIM,
              marginBottom: "12px",
            }}
          >
            Appearance
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            {/* Solid Sun */}
            <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor"
              style={{ color: prefs.theme === "light" ? "#E8B84B" : "var(--s-dim)", transition: "color 0.3s", flexShrink: 0 }}>
              <circle cx="12" cy="12" r="5"/>
              <path fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M17.66 6.34l-1.41 1.41M4.93 19.07l1.41-1.41"/>
            </svg>

            {/* Toggle pill */}
            <button
              onClick={() => { onThemeChange(prefs.theme === "dark" ? "light" : "dark"); }}
              style={{
                position: "relative",
                width: "52px",
                height: "28px",
                borderRadius: "14px",
                background: prefs.theme === "light" ? "rgba(232,184,75,0.28)" : "rgba(47,107,67,0.38)",
                border: `1px solid ${prefs.theme === "light" ? "rgba(232,184,75,0.45)" : "rgba(47,107,67,0.55)"}`,
                cursor: "pointer",
                transition: "background 0.35s, border-color 0.35s",
                outline: "none",
                flexShrink: 0,
                animation: "none",
              }}
              onMouseDown={(e) => (e.currentTarget.style.animation = "themeTogglePop 0.35s ease")}
              onAnimationEnd={(e) => (e.currentTarget.style.animation = "none")}
              aria-label="Toggle theme"
            >
              <span
                style={{
                  position: "absolute",
                  top: "3px",
                  left: prefs.theme === "light" ? "27px" : "3px",
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  background: prefs.theme === "light"
                    ? "linear-gradient(135deg, #F0C84E, #D4A030)"
                    : "linear-gradient(135deg, #5A9E72, #2F6B43)",
                  boxShadow: prefs.theme === "light"
                    ? "0 2px 8px rgba(232,184,75,0.6)"
                    : "0 2px 8px rgba(30,77,48,0.65)",
                  transition: "left 0.32s cubic-bezier(0.34,1.56,0.64,1), background 0.32s, box-shadow 0.32s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {prefs.theme === "light" ? (
                  /* Solid sun on thumb */
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="rgba(255,255,255,0.95)">
                    <circle cx="12" cy="12" r="5"/>
                    <path fill="none" stroke="rgba(255,255,255,0.95)" strokeWidth="2.5" strokeLinecap="round"
                      d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M17.66 6.34l-1.41 1.41M4.93 19.07l1.41-1.41"/>
                  </svg>
                ) : (
                  /* Solid moon on thumb */
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="rgba(255,255,255,0.9)">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                  </svg>
                )}
              </span>
            </button>

            {/* Solid Moon */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"
              style={{ color: prefs.theme === "dark" ? ACCENT3 : "var(--s-dim)", transition: "color 0.3s", flexShrink: 0 }}>
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>

            <span style={{ fontSize: "12px", fontWeight: 500, color: prefs.theme === "light" ? "#D4920A" : ACCENT3, letterSpacing: "0.2px", transition: "color 0.3s" }}>
              {prefs.theme === "light" ? "Light" : "Dark"}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px", marginTop: "1.75rem" }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "0.7rem",
              background: "transparent",
              border: `1px solid ${BORDER2}`,
              borderRadius: "8px",
              color: MUTED,
              fontFamily: SANS,
              fontSize: "13px",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            Close
          </button>
          <button
            onClick={() => { onReset(); onClose(); }}
            style={{
              flex: 1,
              padding: "0.7rem",
              background: "transparent",
              border: `1px solid rgba(180,60,60,0.3)`,
              borderRadius: "8px",
              color: "rgba(220,100,100,0.7)",
              fontFamily: SANS,
              fontSize: "13px",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            Clear all data
          </button>
        </div>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          style={{
            marginTop: "0.75rem",
            width: "100%",
            padding: "0.65rem",
            background: "transparent",
            border: `1px solid ${BORDER}`,
            borderRadius: "8px",
            color: DIM,
            fontFamily: SANS,
            fontSize: "13px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            transition: "color 0.15s, border-color 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = PARCHMENT; e.currentTarget.style.borderColor = BORDER2; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = DIM; e.currentTarget.style.borderColor = BORDER; }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Sign out
        </button>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════
   VIEWS
   ════════════════════════════════════════════════════ */

/* ── Quick-Add Habit Modal ── */
function AddHabitModal({ onAdd, onClose }) {
  const [name, setName]       = useState("");
  const [timeSlot, setTimeSlot] = useState("Morning");
  const [category, setCategory] = useState("health");
  const [cue, setCue]           = useState("");
  const [reward, setReward]     = useState("");
  const [error, setError]       = useState("");

  function submit() {
    if (!name.trim()) { setError("Habit name is required."); return; }
    onAdd({ name: name.trim(), timeSlot, category, cue: cue.trim(), reward: reward.trim() });
    onClose();
  }

  const fieldLabel = {
    fontSize: "10px",
    fontWeight: 500,
    textTransform: "uppercase",
    letterSpacing: "1.5px",
    color: DIM,
    display: "block",
    marginBottom: "6px",
  };

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed",
        inset: 0,
        background: "var(--s-overlay)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 200,
        animation: "fadeIn 0.18s ease",
      }}
    >
      <div
        style={{
          background: "var(--s-bg2)",
          border: `1px solid ${BORDER2}`,
          borderRadius: "16px",
          padding: "2rem 2.25rem 2.25rem",
          width: "min(480px, 92vw)",
          boxShadow: "0 24px 60px rgba(0,0,0,0.55)",
          animation: "slideUp 0.22s ease",
          position: "relative",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.75rem" }}>
          <div>
            <p style={{ fontSize: "9px", fontWeight: 500, letterSpacing: "2.5px", textTransform: "uppercase", color: GOLD3, marginBottom: "6px" }}>Quick Add</p>
            <h2 style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: "24px", fontWeight: 400, color: PARCHMENT, lineHeight: 1.2 }}>New Habit</h2>
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

        <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
          {/* Name */}
          <div>
            <label style={fieldLabel}>Habit name</label>
            <input
              autoFocus
              style={inputBase}
              value={name}
              onChange={(e) => { setName(e.target.value); setError(""); }}
              placeholder="e.g. Read 20 pages"
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
            {error && <p style={{ fontSize: "11px", color: "rgba(220,100,100,0.7)", marginTop: "4px" }}>{error}</p>}
          </div>

          {/* Time + Category */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={fieldLabel}>Time of day</label>
              <select style={{ ...inputBase, cursor: "pointer" }} value={timeSlot} onChange={(e) => setTimeSlot(e.target.value)}>
                {TIME_SLOTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={fieldLabel}>Category</label>
              <select style={{ ...inputBase, cursor: "pointer" }} value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="health">Health</option>
                <option value="mind">Mind</option>
                <option value="work">Work</option>
                <option value="social">Social</option>
                <option value="general">General</option>
              </select>
            </div>
          </div>

          {/* Cue */}
          <div>
            <label style={fieldLabel}>Cue <span style={{ opacity: 0.5, textTransform: "none", letterSpacing: 0 }}>(optional)</span></label>
            <input style={inputBase} value={cue} onChange={(e) => setCue(e.target.value)} placeholder="After I wake up..." />
          </div>

          {/* Reward */}
          <div>
            <label style={fieldLabel}>Reward <span style={{ opacity: 0.5, textTransform: "none", letterSpacing: 0 }}>(optional)</span></label>
            <input style={inputBase} value={reward} onChange={(e) => setReward(e.target.value)} placeholder="I will treat myself to..." />
          </div>

          {/* Submit */}
          <div style={{ paddingTop: "0.5rem", display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
            <button
              onClick={onClose}
              style={{ padding: "0.65rem 1.25rem", background: "transparent", border: `1px solid ${BORDER2}`, borderRadius: "50px", color: MUTED, fontFamily: SANS, fontSize: "13px", cursor: "pointer", transition: "all 0.15s" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--s-dim)"; e.currentTarget.style.color = PARCHMENT; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = BORDER2; e.currentTarget.style.color = MUTED; }}
            >
              Cancel
            </button>
            <button
              onClick={submit}
              style={{ padding: "0.65rem 1.75rem", background: ACCENT, border: "none", borderRadius: "50px", color: PARCHMENT, fontFamily: SANS, fontSize: "13px", fontWeight: 500, cursor: "pointer", letterSpacing: "0.3px", transition: "background 0.2s", boxShadow: "0 4px 20px rgba(30,77,48,0.25)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT2)}
              onMouseLeave={(e) => (e.currentTarget.style.background = ACCENT)}
            >
              Add Habit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Dashboard View ── */
function DashboardView({ habits, completions, prefs, date, onNavigate, onAdd, intentions, onNavigateIntent, missedHabits, dismissed, onDismiss, onAdjust }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const todayKey = getDayKey(date);
  const todayCompletions = completions[todayKey] || {};
  const doneCount = habits.filter((h) => todayCompletions[h.id]).length;
  const pct = habits.length ? Math.round((doneCount / habits.length) * 100) : 0;

  const greetHour = date.getHours();
  const greetTime = greetHour < 12 ? "morning" : greetHour < 17 ? "afternoon" : "evening";
  const name = prefs.name ? `, ${prefs.name}` : "";

  const greeting =
    pct === 100
      ? `Excellent work${name}. All done for today.`
      : doneCount === 0
      ? `Good ${greetTime}${name}. You're building consistency.`
      : `Keep going${name}. ${habits.length - doneCount} habit${habits.length - doneCount !== 1 ? "s" : ""} remaining.`;

  const grouped = TIME_SLOTS.map((slot) => ({
    slot,
    habits: habits.filter((h) => (h.timeSlot || "Morning") === slot),
  })).filter((g) => g.habits.length > 0);

  const quote = QUOTES[date.getDate() % QUOTES.length];

  return (
    <div style={{ padding: "2.5rem 2.5rem 2.5rem 2rem", minHeight: "100vh", position: "relative" }}>
      {/* Quick-add modal */}
      {showAddModal && <AddHabitModal onAdd={onAdd} onClose={() => setShowAddModal(false)} />}

      {/* Floating + button */}
      <button
        onClick={() => setShowAddModal(true)}
        title="Add a new habit"
        style={{
          position: "absolute",
          top: "2.25rem",
          right: "2.25rem",
          width: "38px",
          height: "38px",
          borderRadius: "50%",
          background: ACCENT,
          border: `1px solid ${ACCENT2}`,
          color: PARCHMENT,
          fontSize: "20px",
          lineHeight: "36px",
          textAlign: "center",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 18px rgba(30,77,48,0.3)",
          transition: "background 0.18s, transform 0.15s, box-shadow 0.18s",
          zIndex: 10,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = ACCENT2; e.currentTarget.style.transform = "scale(1.08)"; e.currentTarget.style.boxShadow = "0 6px 24px rgba(30,77,48,0.45)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = ACCENT; e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 4px 18px rgba(30,77,48,0.3)"; }}
        aria-label="Add new habit"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M7 1V13M1 7H13" stroke="#F6F1E8" strokeWidth="1.75" strokeLinecap="round"/>
        </svg>
      </button>

      {/* Top */}
      <div style={{ marginBottom: "2.5rem" }}>
        <p
          style={{
            fontSize: "9px",
            fontWeight: 500,
            letterSpacing: "2.5px",
            textTransform: "uppercase",
            color: GOLD3,
            marginBottom: "0.75rem",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <span
            style={{
              display: "inline-block",
              width: 24,
              height: 1,
              background: GOLD3,
              opacity: 0.5,
            }}
          />
          {date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
        <h1
          style={{
            fontFamily: SERIF,
            fontStyle: "italic",
            fontSize: "clamp(26px, 2.5vw, 38px)",
            fontWeight: 400,
            color: PARCHMENT,
            marginBottom: "1.25rem",
            lineHeight: 1.2,
          }}
        >
          {greeting}
        </h1>

        {/* Progress */}
        <div style={{ maxWidth: "480px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginBottom: "8px",
            }}
          >
            <span style={{ fontSize: "12px", color: MUTED }}>
              {doneCount} of {habits.length} completed
            </span>
            <span
              style={{
                fontFamily: MONO,
                fontSize: "13px",
                color: pct === 100 ? ACCENT3 : PARCHMENT,
              }}
            >
              {pct}%
            </span>
          </div>
          <ProgressBar pct={pct} />
          <ConsistencyScore habits={habits} completions={completions} />
        </div>
      </div>

      <RestartPrompt
        missedHabits={missedHabits || []}
        dismissed={dismissed || {}}
        onDismiss={onDismiss || (() => {})}
        onAdjust={onAdjust || (() => {})}
      />

      {/* Habits by time of day */}
      {habits.length === 0 ? (
        <div
          style={{
            ...card,
            maxWidth: "480px",
            textAlign: "center",
            padding: "3rem 2rem",
          }}
        >
          <p
            style={{
              fontFamily: SERIF,
              fontStyle: "italic",
              fontSize: "20px",
              color: MUTED,
              marginBottom: "1rem",
            }}
          >
            No habits yet.
          </p>
          <button
            onClick={() => onNavigate("add-habit")}
            style={{
              padding: "0.65rem 1.5rem",
              background: ACCENT,
              border: "none",
              borderRadius: "50px",
              color: PARCHMENT,
              fontFamily: SANS,
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
              transition: "background 0.2s",
            }}
          >
            Add your first habit
          </button>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 280px",
            gap: "2rem",
            alignItems: "start",
          }}
        >
          {/* Habit columns */}
          <div>
            {grouped.map(({ slot, habits: slotHabits }) => (
              <HabitSection
                key={slot}
                slot={slot}
                habits={slotHabits}
                todayCompletions={todayCompletions}
                completions={completions}
              />
            ))}
          </div>

          {/* Right: mini calendar + quote */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={card}>
              <MiniCalendar completions={completions} allHabits={habits} date={date} />
            </div>
            <div
              style={{
                padding: "1.25rem",
                borderLeft: `2px solid rgba(232,184,75,0.2)`,
              }}
            >
              <p
                style={{
                  fontFamily: SERIF,
                  fontStyle: "italic",
                  fontSize: "14px",
                  color: MUTED,
                  lineHeight: 1.65,
                  marginBottom: "0.5rem",
                }}
              >
                "{quote}"
              </p>
            </div>
            <SuggestionPanel
              habits={habits}
              completions={completions}
              date={date}
              onNavigate={onNavigateIntent || onNavigate}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Habit section by time slot ── */
function HabitSection({ slot, habits, todayCompletions, completions }) {
  const [localDone, setLocalDone] = useState(() => {
    const init = {};
    habits.forEach((h) => { init[h.id] = todayCompletions[h.id] || false; });
    return init;
  });

  useEffect(() => {
    const updated = {};
    habits.forEach((h) => { updated[h.id] = todayCompletions[h.id] || false; });
    setLocalDone(updated);
  }, [todayCompletions, habits]);

  function getStreak(habitId) {
    const today = new Date();
    let streak = 0;
    const d = new Date(today);
    while (true) {
      const key = getDayKey(d);
      if (completions[key] && completions[key][habitId]) {
        streak++;
        d.setDate(d.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  }

  function toggle(habitId) {
    setLocalDone((prev) => ({ ...prev, [habitId]: !prev[habitId] }));
    // Persist via parent state is handled by HabitTracker via event bubbling
    // For now local optimistic state — real persistence wired below
    const event = new CustomEvent("habitToggle", { detail: { habitId } });
    window.dispatchEvent(event);
  }

  return (
    <div style={{ marginBottom: "1.75rem" }}>
      <div
        style={{
          fontSize: "9px",
          fontWeight: 500,
          letterSpacing: "2.5px",
          textTransform: "uppercase",
          color: DIM,
          marginBottom: "0.6rem",
        }}
      >
        {slot}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        {habits.map((h) => (
          <HabitRow
            key={h.id}
            habit={h}
            done={localDone[h.id] || false}
            streak={getStreak(h.id)}
            onToggle={() => toggle(h.id)}
          />
        ))}
      </div>
    </div>
  );
}

/* ── All Habits View ── */
/* ── Single expandable habit row ── */
function HabitDetailRow({ h, onDelete, notes, onAddNote, date }) {
  const [open, setOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const todayKey = getDayKey(date);
  const todayNotes = ((notes[todayKey] || {})[h.id]) || [];

  function submitNote() {
    const t = noteText.trim();
    if (!t) return;
    onAddNote(h.id, todayKey, t);
    setNoteText("");
  }

  return (
    <div
      style={{
        ...card,
        padding: 0,
        overflow: "hidden",
        borderColor: open ? BORDER2 : BORDER,
        transition: "border-color 0.15s",
      }}
    >
      {/* Clickable header row */}
      <div
        onClick={() => setOpen((v) => !v)}
        style={{
          padding: "0.9rem 1.1rem",
          display: "flex",
          alignItems: "center",
          gap: "0.9rem",
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        {/* Chevron */}
        <div
          style={{
            flexShrink: 0,
            color: DIM,
            transition: "transform 0.2s",
            transform: open ? "rotate(90deg)" : "rotate(0deg)",
            display: "flex",
            alignItems: "center",
          }}
        >
          <svg width="7" height="11" viewBox="0 0 7 11" fill="none">
            <path d="M1 1L6 5.5L1 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "14px", color: PARCHMENT, marginBottom: "2px" }}>{h.name}</div>
          <div style={{ fontSize: "11px", color: DIM }}>
            {h.timeSlot || "Morning"} · {h.category || "General"}{h.cue ? ` · Cue: ${h.cue}` : ""}
          </div>
        </div>

        {/* Note count badge */}
        {todayNotes.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: "4px", color: GOLD3, flexShrink: 0 }}>
            <svg width="12" height="14" viewBox="0 0 12 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="1" y="1" width="10" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M3.5 4.5H8.5M3.5 7H8.5M3.5 9.5H6.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            <span style={{ fontSize: "10px", fontFamily: MONO }}>{todayNotes.length}</span>
          </div>
        )}

        <button
          onClick={(e) => { e.stopPropagation(); onDelete(h.id); }}
          style={{ background: "none", border: "none", color: "var(--s-subtle)", cursor: "pointer", fontSize: "18px", lineHeight: 1, padding: "0 4px", transition: "color 0.15s", flexShrink: 0 }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(220,100,100,0.65)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--s-subtle)")}
          aria-label="Delete habit"
        >
          ×
        </button>
      </div>

      {/* Expanded panel */}
      {open && (
        <div
          style={{
            borderTop: `1px solid ${BORDER}`,
            padding: "1.1rem 1.25rem 1.25rem 2.5rem",
            animation: "slideUp 0.18s ease",
          }}
        >
          {/* Habit metadata */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem", marginBottom: "1.25rem" }}>
            {[
              { label: "Time",     value: h.timeSlot  || "Morning" },
              { label: "Category", value: h.category  || "General" },
              h.cue    ? { label: "Cue",    value: h.cue    } : null,
              h.reward ? { label: "Reward", value: h.reward } : null,
            ].filter(Boolean).map(({ label, value }) => (
              <div key={label}>
                <div style={{ fontSize: "9px", fontWeight: 500, letterSpacing: "1.8px", textTransform: "uppercase", color: DIM, marginBottom: "3px" }}>{label}</div>
                <div style={{ fontSize: "12px", color: MUTED }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Note input */}
          <div style={{ marginBottom: todayNotes.length > 0 ? "0.85rem" : 0 }}>
            <div style={{ fontSize: "9px", fontWeight: 500, letterSpacing: "1.8px", textTransform: "uppercase", color: GOLD3, marginBottom: "8px" }}>
              Add a note · Today
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                style={{ ...inputBase, flex: 1, fontSize: "12px" }}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="How did it go today?"
                onKeyDown={(e) => e.key === "Enter" && submitNote()}
              />
              <button
                onClick={submitNote}
                disabled={!noteText.trim()}
                style={{
                  padding: "0 1.1rem",
                  background: noteText.trim() ? ACCENT : "var(--s-faint)",
                  border: `1px solid ${noteText.trim() ? ACCENT2 : "var(--s-border)"}`,  
                  borderRadius: "8px",
                  color: noteText.trim() ? PARCHMENT : DIM,
                  fontFamily: SANS,
                  fontSize: "12px",
                  cursor: noteText.trim() ? "pointer" : "default",
                  transition: "all 0.15s",
                  whiteSpace: "nowrap",
                }}
              >
                Save
              </button>
            </div>
          </div>

          {/* Saved notes for today */}
          {todayNotes.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              {todayNotes.map((n, idx) => (
                <div
                  key={idx}
                  style={{
                    fontSize: "12px",
                    color: MUTED,
                    padding: "0.45rem 0.8rem",
                    background: FAINT,
                    borderRadius: "6px",
                    lineHeight: 1.55,
                  }}
                >
                  {n}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AllHabitsView({ habits, onDelete, onNavigate, notes, onAddNote, date }) {
  return (
    <div style={{ padding: "2.5rem 2.5rem 2.5rem 2rem" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h2
          style={{
            fontFamily: SERIF,
            fontStyle: "italic",
            fontSize: "28px",
            fontWeight: 400,
            color: PARCHMENT,
          }}
        >
          All Habits
        </h2>
      </div>

      {habits.length === 0 ? (
        <p style={{ fontSize: "14px", color: MUTED }}>No habits yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxWidth: "600px" }}>
          {habits.map((h) => (
            <HabitDetailRow
              key={h.id}
              h={h}
              onDelete={onDelete}
              notes={notes || {}}
              onAddNote={onAddNote}
              date={date}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Add Habit View ── */
function AddHabitView({ onAdd, onNavigate }) {
  const [name, setName] = useState("");
  const [timeSlot, setTimeSlot] = useState("Morning");
  const [category, setCategory] = useState("health");
  const [cue, setCue] = useState("");
  const [reward, setReward] = useState("");
  const [error, setError] = useState("");

  function submit() {
    if (!name.trim()) { setError("Habit name is required."); return; }
    onAdd({ name: name.trim(), timeSlot, category, cue: cue.trim(), reward: reward.trim() });
    setName(""); setCue(""); setReward(""); setError("");
    onNavigate("all-habits");
  }

  const fieldLabel = {
    fontSize: "10px",
    fontWeight: 500,
    textTransform: "uppercase",
    letterSpacing: "1.5px",
    color: DIM,
    display: "block",
    marginBottom: "6px",
  };

  return (
    <div style={{ padding: "2.5rem 2.5rem 2.5rem 2rem" }}>
      <h2
        style={{
          fontFamily: SERIF,
          fontStyle: "italic",
          fontSize: "28px",
          fontWeight: 400,
          color: PARCHMENT,
          marginBottom: "2rem",
        }}
      >
        Add a Habit
      </h2>

      <div style={{ maxWidth: "480px", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <div>
          <label style={fieldLabel}>Habit name</label>
          <input
            style={inputBase}
            value={name}
            onChange={(e) => { setName(e.target.value); setError(""); }}
            placeholder="e.g. Read 20 pages"
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
          {error && <p style={{ fontSize: "11px", color: "rgba(220,100,100,0.7)", marginTop: "4px" }}>{error}</p>}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <label style={fieldLabel}>Time of day</label>
            <select
              style={{ ...inputBase, cursor: "pointer" }}
              value={timeSlot}
              onChange={(e) => setTimeSlot(e.target.value)}
            >
              {TIME_SLOTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={fieldLabel}>Category</label>
            <select
              style={{ ...inputBase, cursor: "pointer" }}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="health">Health</option>
              <option value="mind">Mind</option>
              <option value="work">Work</option>
              <option value="social">Social</option>
              <option value="general">General</option>
            </select>
          </div>
        </div>

        <div>
          <label style={fieldLabel}>Cue (optional)</label>
          <input
            style={inputBase}
            value={cue}
            onChange={(e) => setCue(e.target.value)}
            placeholder="After I wake up..."
          />
        </div>

        <div>
          <label style={fieldLabel}>Reward (optional)</label>
          <input
            style={inputBase}
            value={reward}
            onChange={(e) => setReward(e.target.value)}
            placeholder="I will..."
          />
        </div>

        <div style={{ paddingTop: "0.5rem" }}>
          <button
            onClick={submit}
            style={{
              padding: "0.75rem 2rem",
              background: ACCENT,
              border: "none",
              borderRadius: "50px",
              color: PARCHMENT,
              fontFamily: SANS,
              fontSize: "14px",
              fontWeight: 500,
              cursor: "pointer",
              letterSpacing: "0.3px",
              transition: "background 0.2s, transform 0.15s",
              boxShadow: "0 4px 20px rgba(30,77,48,0.25)",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = ACCENT2; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = ACCENT; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            Add Habit
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Monthly View ── */
function MonthlyView({ habits, completions, date }) {
  const year  = date.getFullYear();
  const month = date.getMonth();
  const days  = getDaysInMonth(year, month);
  const todayKey = getDayKey(date);

  // Which day of the week does the 1st fall on? (0=Sun)
  const firstDow = new Date(year, month, 1).getDay();

  // For a given day number, return completion fraction 0–1
  function dayFraction(d) {
    if (!habits.length) return 0;
    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const dayData = completions[key] || {};
    const done = habits.filter((h) => dayData[h.id]).length;
    return done / habits.length;
  }

  function dayKey(d) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }

  // Selected day state (default = today if in this month, else 1)
  const [selectedDay, setSelectedDay] = useState(() => {
    const todayDate = new Date(date);
    if (todayDate.getFullYear() === year && todayDate.getMonth() === month) {
      return todayDate.getDate();
    }
    return 1;
  });

  const selectedKey  = dayKey(selectedDay);
  const selectedData = completions[selectedKey] || {};
  const isFuture     = (d) => dayKey(d) > todayKey;

  const completedHabits = habits.filter((h) => selectedData[h.id]);
  const pendingHabits   = habits.filter((h) => !selectedData[h.id]);
  const pct = habits.length ? Math.round((completedHabits.length / habits.length) * 100) : 0;

  const monthName = date.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div style={{ padding: "2.5rem 2.5rem 2.5rem 2rem" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <p style={{ fontSize: "9px", fontWeight: 500, letterSpacing: "2.5px", textTransform: "uppercase", color: GOLD3, marginBottom: "0.5rem" }}>
          Monthly Tracker
        </p>
        <h2 style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: "28px", fontWeight: 400, color: PARCHMENT }}>
          {monthName}
        </h2>
      </div>

      {habits.length === 0 ? (
        <p style={{ fontSize: "14px", color: MUTED }}>Add habits to see your monthly progress.</p>
      ) : (
        <div style={{ maxWidth: "700px", display: "flex", flexDirection: "column", gap: "1.75rem" }}>

          {/* ── Calendar grid ── */}
          <div style={{ ...card, padding: "1.5rem" }}>
            {/* Day-of-week headers */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px", marginBottom: "6px" }}>
              {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
                <div key={d} style={{ textAlign: "center", fontSize: "9px", fontFamily: MONO, color: DIM, letterSpacing: "0.5px", paddingBottom: "4px" }}>
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar cells */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px" }}>
              {/* Empty leading cells */}
              {Array.from({ length: firstDow }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}

              {/* Day cells */}
              {Array.from({ length: days }, (_, i) => {
                const d   = i + 1;
                const key = dayKey(d);
                const frac = isFuture(d) ? null : dayFraction(d);
                const isToday    = key === todayKey;
                const isSelected = d === selectedDay;
                const future     = isFuture(d);

                let bg = "var(--s-faint)";
                if (!future && frac !== null) {
                  if (frac === 0)      bg = "var(--s-faint)";
                  else if (frac < 0.5) bg = "rgba(30,77,48,0.28)";
                  else if (frac < 1)   bg = "rgba(47,107,67,0.55)";
                  else                 bg = "rgba(47,107,67,0.90)";
                }

                return (
                  <div
                    key={key}
                    onClick={() => !future && setSelectedDay(d)}
                    style={{
                      aspectRatio: "1",
                      borderRadius: "6px",
                      background: bg,
                      border: isSelected
                        ? `2px solid ${ACCENT3}`
                        : isToday
                        ? `1px solid rgba(232,184,75,0.45)`
                        : "1px solid transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "11px",
                      fontFamily: MONO,
                      color: future ? "var(--s-ghost)" : isToday ? GOLD3 : frac > 0 ? "var(--s-strong)" : MUTED,
                      cursor: future ? "default" : "pointer",
                      transition: "border-color 0.12s, background 0.12s",
                      userSelect: "none",
                    }}
                  >
                    {d}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div style={{ display: "flex", gap: "14px", marginTop: "1rem", flexWrap: "wrap" }}>
              {[
                { bg: "var(--s-faint)", label: "None" },
                { bg: "rgba(30,77,48,0.28)",    label: "Partial" },
                { bg: "rgba(47,107,67,0.55)",    label: "Good" },
                { bg: "rgba(47,107,67,0.90)",    label: "Full" },
              ].map(({ bg, label }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: bg, border: `1px solid ${BORDER}` }} />
                  <span style={{ fontSize: "9px", color: DIM, fontFamily: MONO }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Selected day breakdown ── */}
          <div style={{ ...card, padding: "1.5rem" }}>
            {/* Day heading + progress */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div>
                <p style={{ fontSize: "9px", fontWeight: 500, letterSpacing: "2.5px", textTransform: "uppercase", color: GOLD3, marginBottom: "3px" }}>
                  {new Date(year, month, selectedDay).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
                </p>
                <p style={{ fontSize: "12px", color: MUTED }}>
                  {isFuture(selectedDay)
                    ? "Future date"
                    : completedHabits.length === habits.length
                    ? "All habits completed"
                    : `${completedHabits.length} of ${habits.length} completed`}
                </p>
              </div>
              {!isFuture(selectedDay) && (
                <span style={{ fontFamily: MONO, fontSize: "22px", color: pct === 100 ? ACCENT3 : pct > 0 ? GOLD3 : MUTED }}>
                  {pct}%
                </span>
              )}
            </div>

            {/* Progress bar */}
            {!isFuture(selectedDay) && habits.length > 0 && (
              <div style={{ height: "3px", background: FAINT, borderRadius: "2px", overflow: "hidden", marginBottom: "1.5rem" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${ACCENT2}, ${ACCENT3})`, borderRadius: "2px", transition: "width 0.5s ease" }} />
              </div>
            )}

            {/* Habit list */}
            {isFuture(selectedDay) ? (
              <p style={{ fontSize: "12px", color: DIM }}>No data for future dates.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {/* Completed */}
                {completedHabits.map((h) => (
                  <div key={h.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "0.55rem 0.75rem", background: "rgba(47,107,67,0.08)", borderRadius: "7px", border: "1px solid rgba(47,107,67,0.2)" }}>
                    <div style={{ width: "16px", height: "16px", borderRadius: "50%", background: ACCENT2, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                        <path d="M1 3L3 5L7 1" stroke="#F6F1E8" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <span style={{ fontSize: "13px", color: PARCHMENT, flex: 1 }}>{h.name}</span>
                    <span style={{ fontSize: "10px", color: ACCENT3, fontFamily: MONO }}>Done</span>
                  </div>
                ))}
                {/* Pending */}
                {pendingHabits.map((h) => (
                  <div key={h.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "0.55rem 0.75rem", background: FAINT, borderRadius: "7px", border: `1px solid ${BORDER}` }}>
                    <div style={{ width: "16px", height: "16px", borderRadius: "50%", border: `1px solid ${BORDER2}`, flexShrink: 0 }} />
                    <span style={{ fontSize: "13px", color: MUTED, flex: 1 }}>{h.name}</span>
                    <span style={{ fontSize: "10px", color: DIM, fontFamily: MONO }}>Pending</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}

/* ── Daily View ── */
function DailyView({ habits, completions, date, setCompletions }) {
  const todayKey = getDayKey(date);
  const todayDone = completions[todayKey] || {};
  const doneCount = habits.filter((h) => todayDone[h.id]).length;

  function toggle(id) {
    setCompletions((prev) => {
      const day = { ...(prev[todayKey] || {}), [id]: !prev[todayKey]?.[id] };
      return { ...prev, [todayKey]: day };
    });
  }

  function getStreak(habitId) {
    let streak = 0;
    const d = new Date(date);
    while (true) {
      const key = getDayKey(d);
      if (completions[key] && completions[key][habitId]) {
        streak++;
        d.setDate(d.getDate() - 1);
      } else break;
    }
    return streak;
  }

  return (
    <div style={{ padding: "2.5rem 2.5rem 2.5rem 2rem" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h2
          style={{
            fontFamily: SERIF,
            fontStyle: "italic",
            fontSize: "28px",
            fontWeight: 400,
            color: PARCHMENT,
            marginBottom: "4px",
          }}
        >
          Today
        </h2>
        <p style={{ fontSize: "12px", color: DIM }}>
          {date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
      </div>

      {habits.length > 0 && (
        <div style={{ maxWidth: "480px", marginBottom: "1.75rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ fontSize: "12px", color: MUTED }}>{doneCount} / {habits.length}</span>
            <span style={{ fontFamily: MONO, fontSize: "12px", color: doneCount === habits.length ? ACCENT3 : PARCHMENT }}>
              {habits.length ? Math.round((doneCount / habits.length) * 100) : 0}%
            </span>
          </div>
          <ProgressBar pct={habits.length ? Math.round((doneCount / habits.length) * 100) : 0} />
        </div>
      )}

      {habits.length === 0 ? (
        <p style={{ fontSize: "14px", color: MUTED }}>No habits yet.</p>
      ) : (
        <div style={{ maxWidth: "520px", display: "flex", flexDirection: "column", gap: "4px" }}>
          {TIME_SLOTS.map((slot) => {
            const slotHabits = habits.filter((h) => (h.timeSlot || "Morning") === slot);
            if (!slotHabits.length) return null;
            return (
              <div key={slot} style={{ marginBottom: "1.5rem" }}>
                <div
                  style={{
                    fontSize: "9px",
                    fontWeight: 500,
                    letterSpacing: "2.5px",
                    textTransform: "uppercase",
                    color: DIM,
                    marginBottom: "0.6rem",
                  }}
                >
                  {slot}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  {slotHabits.map((h) => (
                    <HabitRow
                      key={h.id}
                      habit={h}
                      done={todayDone[h.id] || false}
                      streak={getStreak(h.id)}
                      onToggle={() => toggle(h.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Stacking View ── */
function StackingView({ habits }) {
  return (
    <div style={{ padding: "2.5rem 2.5rem 2.5rem 2rem" }}>
      <h2
        style={{
          fontFamily: SERIF,
          fontStyle: "italic",
          fontSize: "28px",
          fontWeight: 400,
          color: PARCHMENT,
          marginBottom: "0.75rem",
        }}
      >
        Habit Stacking
      </h2>
      <p style={{ fontSize: "13px", color: MUTED, maxWidth: "440px", lineHeight: 1.75, marginBottom: "2.5rem" }}>
        Chain habits together. After you do one, you do the next. System-driven, not motivation-driven.
      </p>
      {habits.length < 2 ? (
        <div style={{ ...card, maxWidth: "440px", padding: "2rem" }}>
          <p style={{ fontSize: "13px", color: MUTED, lineHeight: 1.75 }}>
            Add at least two habits to build a stack.
          </p>
        </div>
      ) : (
        <div style={{ maxWidth: "440px" }}>
          {habits.map((h, i) => (
            <div key={h.id} style={{ display: "flex", alignItems: "flex-start", gap: "1rem", marginBottom: "4px" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    border: `1px solid ${BORDER2}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: MONO,
                    fontSize: "10px",
                    color: DIM,
                    flexShrink: 0,
                  }}
                >
                  {i + 1}
                </div>
                {i < habits.length - 1 && (
                  <div
                    style={{
                      width: "1px",
                      flex: 1,
                      minHeight: "28px",
                      background: BORDER,
                      margin: "3px 0",
                    }}
                  />
                )}
              </div>
              <div
                style={{
                  ...card,
                  flex: 1,
                  padding: "0.75rem 1rem",
                  marginBottom: i < habits.length - 1 ? "4px" : 0,
                }}
              >
                <div style={{ fontSize: "13px", color: PARCHMENT }}>{h.name}</div>
                {h.cue && (
                  <div style={{ fontSize: "11px", color: DIM, marginTop: "2px" }}>
                    After: {h.cue}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Analytics View ── */
function AnalyticsView({ habits, completions, date, notes }) {
  function getStreak(habitId) {
    let streak = 0;
    const d = new Date(date);
    while (true) {
      const key = getDayKey(d);
      if (completions[key] && completions[key][habitId]) { streak++; d.setDate(d.getDate() - 1); }
      else break;
    }
    return streak;
  }

  function getBestStreak(habitId) {
    const year = date.getFullYear();
    let best = 0, cur = 0;
    for (let m = 0; m < 12; m++) {
      const days = getDaysInMonth(year, m);
      for (let d = 1; d <= days; d++) {
        const key = `${year}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        if (completions[key] && completions[key][habitId]) { cur++; best = Math.max(best, cur); }
        else cur = 0;
      }
    }
    return best;
  }

  // Weekly completion rate (last 7 days)
  function getWeeklyRate(habitId) {
    let done = 0;
    const d = new Date(date);
    for (let i = 0; i < 7; i++) {
      const key = getDayKey(d);
      if (completions[key] && completions[key][habitId]) done++;
      d.setDate(d.getDate() - 1);
    }
    return Math.round((done / 7) * 100);
  }

  // Last 12 weeks bar data for overall completion
  function getWeeklyBars() {
    const bars = [];
    for (let w = 11; w >= 0; w--) {
      const weekStart = new Date(date);
      weekStart.setDate(weekStart.getDate() - w * 7 - weekStart.getDay());
      let total = 0, done = 0;
      for (let d = 0; d < 7; d++) {
        const day = new Date(weekStart);
        day.setDate(weekStart.getDate() + d);
        const key = getDayKey(day);
        if (day > date) continue;
        habits.forEach((h) => {
          total++;
          if (completions[key] && completions[key][h.id]) done++;
        });
      }
      const pct = total > 0 ? done / total : 0;
      bars.push(pct);
    }
    return bars;
  }

  const weeklyBars = getWeeklyBars();
  const STAT_BOX = {
    ...card,
    textAlign: "center",
    padding: "1.25rem",
  };

  return (
    <div style={{ padding: "2.5rem 2.5rem 2.5rem 2rem" }}>
      <h2
        style={{
          fontFamily: SERIF,
          fontStyle: "italic",
          fontSize: "28px",
          fontWeight: 400,
          color: PARCHMENT,
          marginBottom: "2rem",
        }}
      >
        Analytics
      </h2>

      {habits.length === 0 ? (
        <p style={{ fontSize: "14px", color: MUTED }}>Add habits to see analytics.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem", maxWidth: "860px" }}>

          {/* Heatmap */}
          <div style={card}>
            <div
              style={{
                fontSize: "9px",
                fontWeight: 500,
                letterSpacing: "2.5px",
                textTransform: "uppercase",
                color: GOLD3,
                marginBottom: "1.25rem",
              }}
            >
              {date.getFullYear()} · Completion Heatmap
            </div>
            <YearHeatmap completions={completions} allHabits={habits} />
            <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "0.75rem" }}>
              {[
                { bg: "var(--s-faint)", label: "None" },
                { bg: "rgba(30,77,48,0.35)", label: "Partial" },
                { bg: "rgba(47,107,67,0.55)", label: "Good" },
                { bg: "rgba(47,107,67,0.95)", label: "Full" },
              ].map(({ bg, label }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: bg }} />
                  <span style={{ fontSize: "9px", color: DIM, fontFamily: MONO }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly bars */}
          <div style={card}>
            <div
              style={{
                fontSize: "9px",
                fontWeight: 500,
                letterSpacing: "2.5px",
                textTransform: "uppercase",
                color: GOLD3,
                marginBottom: "1rem",
              }}
            >
              Weekly Completion · Last 12 Weeks
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                gap: "6px",
                height: "80px",
              }}
            >
              {weeklyBars.map((pct, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: `${Math.max(pct * 100, 4)}%`,
                    borderRadius: "3px 3px 0 0",
                    background: pct > 0
                      ? `rgba(47,107,67,${0.3 + pct * 0.65})`
                      : "var(--s-faint)",
                    transition: "height 0.5s ease",
                    position: "relative",
                  }}
                />
              ))}
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: "6px",
              }}
            >
              <span style={{ fontSize: "9px", fontFamily: MONO, color: DIM }}>12w ago</span>
              <span style={{ fontSize: "9px", fontFamily: MONO, color: DIM }}>This week</span>
            </div>
          </div>

          {/* Per-habit streaks */}
          <div style={card}>
            <div
              style={{
                fontSize: "9px",
                fontWeight: 500,
                letterSpacing: "2.5px",
                textTransform: "uppercase",
                color: GOLD3,
                marginBottom: "1.25rem",
              }}
            >
              Habit Breakdown
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {habits.map((h) => {
                const streak = getStreak(h.id);
                const best = getBestStreak(h.id);
                const weekly = getWeeklyRate(h.id);
                // Count total notes for this habit across all dates
                const totalNotes = Object.values(notes || {}).reduce((sum, dayNotes) => {
                  return sum + ((dayNotes[h.id] || []).length);
                }, 0);
                return (
                  <div key={h.id}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "6px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "13px", color: PARCHMENT }}>{h.name}</span>
                        {totalNotes > 0 && (
                          <div
                            title={`${totalNotes} note${totalNotes !== 1 ? "s" : ""}`}
                            style={{ display: "flex", alignItems: "center", gap: "3px", color: GOLD3, opacity: 0.75 }}
                          >
                            <svg width="11" height="13" viewBox="0 0 12 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <rect x="1" y="1" width="10" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                              <path d="M3.5 4.5H8.5M3.5 7H8.5M3.5 9.5H6.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                            </svg>
                            <span style={{ fontSize: "9px", fontFamily: MONO }}>{totalNotes}</span>
                          </div>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: "1.5rem" }}>
                        <span style={{ fontSize: "11px", fontFamily: MONO, color: streak > 0 ? GOLD3 : DIM }}>
                          {streak}d streak
                        </span>
                        <span style={{ fontSize: "11px", fontFamily: MONO, color: DIM }}>
                          best {best}d
                        </span>
                        <span style={{ fontSize: "11px", fontFamily: MONO, color: ACCENT3 }}>
                          {weekly}% / wk
                        </span>
                      </div>
                    </div>
                    <div
                      style={{
                        height: "2px",
                        background: "var(--s-faint)",
                        borderRadius: "2px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${weekly}%`,
                          background: `linear-gradient(90deg, ${ACCENT2}, ${ACCENT3})`,
                          borderRadius: "2px",
                          transition: "width 0.6s ease",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════
   ROOT COMPONENT
   ════════════════════════════════════════════════════ */
export default function HabitTracker() {
  const { data: session } = useSession();
  const [habits, setHabits] = useState([]);
  const [completions, setCompletions] = useState({});
  const [prefs, setPrefs] = useState({ name: "", theme: "dark" });
  const [activeView, setActiveView] = useState("dashboard");
  const [showSettings, setShowSettings] = useState(false);
  const settingsRef = useRef(null);
  const [intentions, setIntentions] = useState([]);
  const [dismissedRestarts, setDismissedRestarts] = useState({});
  const [notes, setNotes] = useState({});
  const [date] = useState(new Date());
  const [mounted, setMounted] = useState(false);
  const [themeAnim, setThemeAnim] = useState(null);

  /* ── Close settings dropdown on outside click ── */
  useEffect(() => {
    if (!showSettings) return;
    function handleOutside(e) {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) {
        setShowSettings(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [showSettings]);

  /* ── Load from Supabase on session ready ── */
  useEffect(() => {
    const userId = session?.user?.email;
    if (!userId) return;
    setMounted(true);
    Promise.all([
      fetchHabits(userId),
      fetchCompletions(userId),
      fetchPrefs(userId),
      fetchIntentions(userId),
      fetchNotes(userId),
    ]).then(([h, c, p, i, n]) => {
      setHabits(h);
      setCompletions(c);
      if (p) {
        setPrefs({ name: p.name || "", theme: p.theme || "dark" });
      } else {
        // First login — seed name from Google profile
        const firstName = session.user.name?.split(" ")[0] || "";
        setPrefs((prev) => ({ ...prev, name: firstName }));
      }
      setIntentions(i);
      setNotes(n);
    });
  }, [session]);

  /* ── Sync prefs to Supabase (debounced 600 ms) ── */
  useEffect(() => {
    const userId = session?.user?.email;
    if (!mounted || !userId) return;
    const t = setTimeout(() => upsertPrefs(userId, prefs), 600);
    return () => clearTimeout(t);
  }, [prefs, mounted, session]);

  /* ── Habit toggle listener (dashboard HabitSection fires custom event) ── */
  useEffect(() => {
    const userId = session?.user?.email;
    function handle(e) {
      const { habitId } = e.detail;
      const todayKey = getDayKey(date);
      setCompletions((prev) => {
        const nowCompleted = !prev[todayKey]?.[habitId];
        const day = { ...(prev[todayKey] || {}), [habitId]: nowCompleted };
        if (userId) toggleCompletionDb(userId, habitId, todayKey, nowCompleted);
        return { ...prev, [todayKey]: day };
      });
    }
    window.addEventListener("habitToggle", handle);
    return () => window.removeEventListener("habitToggle", handle);
  }, [date, session]);

  /* ── Actions ── */
  function addHabit({ name, timeSlot, category, cue, reward }) {
    const id = `h_${Date.now()}`;
    const habit = { id, name, timeSlot, category, cue, reward };
    setHabits((prev) => [...prev, habit]);
    const userId = session?.user?.email;
    if (userId) insertHabit(userId, habit);
  }

  function deleteHabit(id) {
    setHabits((prev) => prev.filter((h) => h.id !== id));
    setCompletions((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((day) => {
        const d = { ...next[day] };
        delete d[id];
        next[day] = d;
      });
      return next;
    });
    const userId = session?.user?.email;
    if (userId) deleteHabitDb(userId, id);
  }

  function handleAdjustHabit(habitId, action) {
    if (action === "move") {
      setHabits((prev) =>
        prev.map((h) => {
          if (h.id !== habitId) return h;
          const slots = ["Morning", "Afternoon", "Evening"];
          const idx = slots.indexOf(h.timeSlot || "Morning");
          const next = { ...h, timeSlot: slots[(idx + 1) % slots.length] };
          const userId = session?.user?.email;
          if (userId) updateHabitDb(userId, habitId, { timeSlot: next.timeSlot });
          return next;
        })
      );
    }
    // 'reduce' and 'attach' are guidance suggestions — no automatic state change
  }

  function resetAll() {
    const userId = session?.user?.email;
    setHabits([]);
    setCompletions({});
    setPrefs({ name: "", theme: "dark" });
    if (userId) resetAllDb(userId);
  }

  function handleThemeChange(next) {
    setPrefs((p) => ({ ...p, theme: next }));
    setThemeAnim(next === "light" ? "to-light" : "to-dark");
    setTimeout(() => setThemeAnim(null), 1200);
  }

  /* ── Failure detection: habits missed 2+ consecutive days ── */
  const missedHabits = habits
    .map((h) => {
      let missed = 0;
      const d = new Date(date);
      d.setDate(d.getDate() - 1);
      for (let i = 0; i < 7; i++) {
        const key = getDayKey(d);
        if (!completions[key] || !completions[key][h.id]) {
          missed++;
          d.setDate(d.getDate() - 1);
        } else {
          break;
        }
      }
      return missed >= 2 ? { habit: h, daysMissed: missed } : null;
    })
    .filter(Boolean);

  /* ── Active view renderer ── */
  function renderView() {
    switch (activeView) {
      case "dashboard":
        return (
          <DashboardView
            habits={habits}
            completions={completions}
            prefs={prefs}
            date={date}
            onNavigate={setActiveView}
            onAdd={addHabit}
            intentions={intentions}
            onNavigateIntent={() => setActiveView("intention")}
            missedHabits={missedHabits}
            dismissed={dismissedRestarts}
            onDismiss={(id) => setDismissedRestarts((prev) => ({ ...prev, [id]: true }))}
            onAdjust={handleAdjustHabit}
          />
        );
      case "all-habits":
        return (
          <AllHabitsView
            habits={habits}
            onDelete={deleteHabit}
            onNavigate={setActiveView}
            notes={notes}
            onAddNote={(habitId, dateKey, text) => {
              setNotes((prev) => ({
                ...prev,
                [dateKey]: {
                  ...(prev[dateKey] || {}),
                  [habitId]: [...((prev[dateKey] || {})[habitId] || []), text],
                },
              }));
              const userId = session?.user?.email;
              if (userId) insertNoteDb(userId, habitId, dateKey, text);
            }}
            date={date}
          />
        );
      case "add-habit":
        return <AddHabitView onAdd={addHabit} onNavigate={setActiveView} />;
      case "monthly":
        return (
          <MonthlyView
            habits={habits}
            completions={completions}
            date={date}
          />
        );
      case "daily":
        return (
          <DailyView
            habits={habits}
            completions={completions}
            date={date}
            setCompletions={setCompletions}
          />
        );
      case "stacking":
        return <StackingView habits={habits} />;
      case "analytics":
        return (
          <AnalyticsView
            habits={habits}
            completions={completions}
            date={date}
            notes={notes}
          />
        );
      case "intention":
        return (
          <div style={{ padding: "2.5rem 2.5rem 2.5rem 2rem" }}>
            <IntentionBuilderView
              habits={habits}
              intentions={intentions}
              setIntentions={setIntentions}
              userId={session?.user?.email}
            />
          </div>
        );
      case "review":
        return (
          <div style={{ padding: "2.5rem 2.5rem 2.5rem 2rem" }}>
            <ReviewView
              habits={habits}
              completions={completions}
              date={date}
            />
          </div>
        );
      default:
        return null;
    }
  }

  if (!mounted) return null;

  const isLight = prefs.theme === "light";

  return (
    <div
      data-theme={isLight ? "light" : "dark"}
      style={{
        minHeight: "100vh",
        background: INK,
        color: PARCHMENT,
        fontFamily: SANS,
        display: "flex",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      <style>{`
        /* ── Theme variables ── */
        [data-theme="dark"] {
          --s-bg:            #16140F;
          --s-bg2:           #1C1A14;
          --s-text:          #F6F1E8;
          --s-border:        rgba(246,241,232,0.08);
          --s-border2:       rgba(246,241,232,0.13);
          --s-muted:         rgba(246,241,232,0.40);
          --s-dim:           rgba(246,241,232,0.28);
          --s-faint:         rgba(246,241,232,0.07);
          --s-subtle:        rgba(246,241,232,0.18);
          --s-strong:        rgba(246,241,232,0.70);
          --s-ghost:         rgba(246,241,232,0.12);
          --s-card-bg:       rgba(246,241,232,0.03);
          --s-input-bg:      rgba(246,241,232,0.04);
          --s-input-border:  rgba(246,241,232,0.10);
          --s-scrollbar:     rgba(246,241,232,0.10);
          --s-placeholder:   rgba(246,241,232,0.22);
          --s-select-bg:     #2E2B24;
          --s-overlay:       rgba(22,20,15,0.75);
          --crgb:            246,241,232;
        }
        [data-theme="light"] {
          --s-bg:            #F0E9DA;
          --s-bg2:           #E5DDD0;
          --s-text:          #1C1A14;
          --s-border:        rgba(22,20,15,0.11);
          --s-border2:       rgba(22,20,15,0.18);
          --s-muted:         rgba(22,20,15,0.46);
          --s-dim:           rgba(22,20,15,0.34);
          --s-faint:         rgba(22,20,15,0.08);
          --s-subtle:        rgba(22,20,15,0.24);
          --s-strong:        rgba(22,20,15,0.74);
          --s-ghost:         rgba(22,20,15,0.20);
          --s-card-bg:       rgba(22,20,15,0.055);
          --s-input-bg:      rgba(22,20,15,0.055);
          --s-input-border:  rgba(22,20,15,0.15);
          --s-scrollbar:     rgba(22,20,15,0.15);
          --s-placeholder:   rgba(22,20,15,0.30);
          --s-select-bg:     #D5CBBA;
          --s-overlay:       rgba(22,20,15,0.62);
          --crgb:            22,20,15;
        }
        *,*::before,*::after { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--s-scrollbar); border-radius: 4px; }
        ::placeholder { color: var(--s-placeholder) !important; }
        select option { background: var(--s-select-bg); color: var(--s-text); }
        input:focus, select:focus, textarea:focus { border-color: rgba(90,158,114,0.55) !important; }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes slideUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes settingsDropIn { from{opacity:0;transform:translateY(12px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes themeTogglePop { 0%{transform:scale(1)} 40%{transform:scale(1.18)} 70%{transform:scale(0.93)} 100%{transform:scale(1)} }
        @keyframes sunRiseAnim {
          0%   { transform:translate(calc(-50vw - 55px),calc(50vh + 55px)) scale(0.08) rotate(-20deg); opacity:0; }
          18%  { opacity:1; }
          60%  { transform:translate(0,0) scale(1.05) rotate(4deg); opacity:1; }
          100% { transform:translate(0,0) scale(3.8) rotate(22deg); opacity:0; }
        }
        @keyframes moonRiseAnim {
          0%   { transform:translate(calc(50vw + 50px),calc(50vh + 50px)) scale(0.08); opacity:0; }
          18%  { opacity:1; }
          60%  { transform:translate(0,0) scale(1.05); opacity:1; }
          100% { transform:translate(0,0) scale(3.8); opacity:0; }
        }
        .habit-row { transition: all 0.18s; }
      `}</style>

      {/* Theme transition animation */}
      {themeAnim && (
        <div style={{ position: "fixed", inset: 0, zIndex: 900, pointerEvents: "none", overflow: "hidden" }}>
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              marginLeft: themeAnim === "to-light" ? "-55px" : "-50px",
              marginTop: themeAnim === "to-light" ? "-55px" : "-50px",
              animation: `${themeAnim === "to-light" ? "sunRiseAnim" : "moonRiseAnim"} 1.2s cubic-bezier(0.22,1,0.36,1) forwards`,
            }}
          >
            {themeAnim === "to-light" ? (
              <svg width="110" height="110" viewBox="0 0 110 110" fill="none">
                <circle cx="55" cy="55" r="48" fill="rgba(232,184,75,0.18)"/>
                <circle cx="55" cy="55" r="30" fill="#E8B84B"/>
                <g stroke="#E8B84B" strokeWidth="4.5" strokeLinecap="round" opacity="0.9">
                  <line x1="55" y1="5" x2="55" y2="20"/>
                  <line x1="55" y1="90" x2="55" y2="105"/>
                  <line x1="5" y1="55" x2="20" y2="55"/>
                  <line x1="90" y1="55" x2="105" y2="55"/>
                  <line x1="18" y1="18" x2="29" y2="29"/>
                  <line x1="81" y1="81" x2="92" y2="92"/>
                  <line x1="92" y1="18" x2="81" y2="29"/>
                  <line x1="29" y1="81" x2="18" y2="92"/>
                </g>
              </svg>
            ) : (
              <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
                <circle cx="50" cy="50" r="44" fill="rgba(47,107,67,0.18)"/>
                <path d="M68 26A28 28 0 1 0 68 74 20 20 0 1 1 68 26Z" fill="#5A9E72"/>
                <circle cx="79" cy="21" r="3.5" fill="rgba(246,241,232,0.8)"/>
                <circle cx="23" cy="37" r="2.2" fill="rgba(246,241,232,0.55)"/>
                <circle cx="75" cy="79" r="2.8" fill="rgba(246,241,232,0.65)"/>
                <circle cx="37" cy="19" r="1.8" fill="rgba(246,241,232,0.5)"/>
              </svg>
            )}
          </div>
        </div>
      )}

      <Sidebar
        active={activeView}
        setActive={setActiveView}
      />

      <main style={{ flex: 1, overflowY: "auto", minWidth: 0 }}>
        {renderView()}
      </main>

      {/* Gear button — fixed bottom-right */}
      <div ref={settingsRef} style={{ position: "fixed", bottom: "20px", right: "20px", zIndex: 201 }}>
        <button
          onClick={() => setShowSettings((v) => !v)}
          title="Settings"
          style={{
            width: "46px",
            height: "46px",
            borderRadius: "50%",
            background: INK2,
            border: `1px solid ${showSettings ? BORDER2 : BORDER}`,
            color: showSettings ? PARCHMENT : DIM,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 20px rgba(0,0,0,0.35)",
            transition: "color 0.15s, border-color 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = PARCHMENT; e.currentTarget.style.borderColor = BORDER2; }}
          onMouseLeave={(e) => { if (!showSettings) { e.currentTarget.style.color = DIM; e.currentTarget.style.borderColor = BORDER; } }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <SettingsModal
          open={showSettings}
          onClose={() => setShowSettings(false)}
          prefs={prefs}
          setPrefs={setPrefs}
          onReset={resetAll}
          onThemeChange={handleThemeChange}
          session={session}
        />
      </div>
    </div>
  );
}
