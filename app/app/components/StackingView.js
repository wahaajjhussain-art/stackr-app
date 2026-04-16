"use client";

import { useState, useEffect } from "react";
import { insertStackDb, updateStackDb, deleteStackDb } from "@/lib/db";

/* ── Design tokens ── */
const PARCHMENT  = "var(--s-text)";
const PARCHMENT2 = "#EEE8DC";
const ACCENT     = "#1E4D30";
const ACCENT2    = "#2F6B43";
const ACCENT3    = "#5A9E72";
const GOLD3      = "#E8B84B";
const MUTED      = "var(--s-muted)";
const DIM        = "var(--s-dim)";
const BORDER     = "var(--s-border)";
const BORDER2    = "var(--s-border2)";
const SANS       = "'DM Sans', sans-serif";
const SERIF      = "'Cormorant Garamond', serif";

/* ════════════════════════════════════════════════════
   INTRO OVERLAY — 3-step walkthrough
   ════════════════════════════════════════════════════ */
const INTRO_STEPS = [
  {
    badge: "What is it?",
    title: "Habit Stacking",
    body: "Habit stacking links new behaviours to ones you already own. By placing a new habit directly after an existing one, your brain uses the first as a natural trigger — no willpower required.",
    dragHint: false,
  },
  {
    badge: "How to build",
    title: "Drag & Drop to Connect",
    body: "Drag any habit chip from the pool below onto the canvas. Drop it onto an existing stack to extend the chain, or onto the empty drop zone to start a fresh one.",
    dragHint: true,
  },
  {
    badge: "Why it works",
    title: "The Science Behind It",
    body: "Each habit you already own has a built-in cue. Stacking new habits on top borrows that cue — making the whole chain almost automatic over time.",
    dragHint: false,
  },
];

function IntroOverlay({ onClose }) {
  const [step, setStep] = useState(0);
  const cur = INTRO_STEPS[step];
  const isLast = step === INTRO_STEPS.length - 1;

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.80)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 600, animation: "fadeIn 0.3s ease",
      }}
    >
      <style>{`
        @keyframes hintFloat {
          0%,100% { transform: translateX(0) rotate(-1deg); }
          50%      { transform: translateX(10px) rotate(1deg); }
        }
      `}</style>

      <div style={{
        background: "var(--s-bg2)",
        border: `1px solid ${BORDER2}`,
        borderRadius: "20px",
        padding: "2.5rem 2.5rem 2rem",
        width: "min(500px, 92vw)",
        boxShadow: "0 32px 80px rgba(0,0,0,0.70)",
        animation: "slideUp 0.30s cubic-bezier(0.22,1,0.36,1)",
        textAlign: "center",
      }}>
        {/* Progress pills */}
        <div style={{ display: "flex", gap: "6px", justifyContent: "center", marginBottom: "2rem" }}>
          {INTRO_STEPS.map((_, i) => (
            <div key={i} style={{
              height: "4px",
              width: i === step ? "24px" : "8px",
              borderRadius: "2px",
              background: i === step ? ACCENT3 : i < step ? "rgba(90,158,114,0.35)" : BORDER2,
              transition: "all 0.3s",
            }} />
          ))}
        </div>

        {/* Badge */}
        <div style={{
          display: "inline-block",
          padding: "3px 10px",
          background: "rgba(232,184,75,0.10)",
          border: "1px solid rgba(232,184,75,0.25)",
          borderRadius: "50px",
          fontSize: "9px", fontWeight: 500,
          letterSpacing: "2px", textTransform: "uppercase",
          color: GOLD3, marginBottom: "1rem",
        }}>
          {cur.badge}
        </div>

        {/* Title */}
        <h2 style={{
          fontFamily: SERIF, fontStyle: "italic",
          fontSize: "26px", fontWeight: 400,
          color: PARCHMENT, marginBottom: "0.85rem", lineHeight: 1.3,
        }}>
          {cur.title}
        </h2>

        {/* Body */}
        <p style={{
          fontSize: "13px", color: MUTED, lineHeight: 1.8,
          maxWidth: "380px", margin: "0 auto",
          marginBottom: cur.dragHint ? "1.6rem" : "2.25rem",
        }}>
          {cur.body}
        </p>

        {/* Drag hint animation */}
        {cur.dragHint && (
          <div style={{
            display: "flex", alignItems: "center", gap: "12px",
            justifyContent: "center", marginBottom: "2rem",
          }}>
            <div style={{
              padding: "0.5rem 1.1rem",
              background: "rgba(90,158,114,0.12)",
              border: `1px solid ${ACCENT3}`,
              borderRadius: "8px",
              color: PARCHMENT2, fontSize: "12px", fontFamily: SANS,
              animation: "hintFloat 1.8s ease-in-out infinite",
              cursor: "grab",
              boxShadow: "0 4px 16px rgba(0,0,0,0.30)",
            }}>
              Morning Run
            </div>
            <svg width="28" height="14" viewBox="0 0 28 14" fill="none">
              <path d="M4 7h18M18 2l7 5-7 5" stroke={ACCENT3} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div style={{
              padding: "0.5rem 1.1rem",
              background: "transparent",
              border: `2px dashed rgba(90,158,114,0.45)`,
              borderRadius: "8px",
              color: MUTED, fontSize: "12px", fontFamily: SANS,
            }}>
              Drop here
            </div>
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
          {step > 0 && (
            <button
              onClick={() => setStep(s => s - 1)}
              style={{
                padding: "0.65rem 1.25rem",
                background: "transparent", border: `1px solid ${BORDER2}`,
                borderRadius: "50px", color: MUTED,
                fontFamily: SANS, fontSize: "13px", cursor: "pointer",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = PARCHMENT; e.currentTarget.style.borderColor = "rgba(246,241,232,0.28)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = MUTED; e.currentTarget.style.borderColor = BORDER2; }}
            >
              Back
            </button>
          )}
          <button
            onClick={isLast ? onClose : () => setStep(s => s + 1)}
            style={{
              padding: "0.65rem 1.75rem",
              background: ACCENT, border: `1px solid ${ACCENT2}`,
              borderRadius: "50px", color: PARCHMENT,
              fontFamily: SANS, fontSize: "13px", fontWeight: 500,
              cursor: "pointer", transition: "background 0.2s",
              boxShadow: "0 4px 16px rgba(30,77,48,0.30)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT2)}
            onMouseLeave={(e) => (e.currentTarget.style.background = ACCENT)}
          >
            {isLast ? "Start Stacking →" : "Next →"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════
   TIP CARD — shown until user has their first real stack
   ════════════════════════════════════════════════════ */
function TipCard({ onOpenIntro }) {
  return (
    <div style={{
      padding: "0.9rem 1.1rem",
      background: "rgba(232,184,75,0.05)",
      border: "1px solid rgba(232,184,75,0.18)",
      borderRadius: "10px",
      display: "flex", alignItems: "flex-start", gap: "0.9rem",
      marginBottom: "2rem", maxWidth: "680px",
    }}>
      <span style={{ fontSize: "16px", lineHeight: "20px", flexShrink: 0, marginTop: "1px" }}>⛓</span>
      <p style={{ fontSize: "12px", color: MUTED, lineHeight: 1.75, margin: 0, flex: 1 }}>
        <strong style={{ color: PARCHMENT, fontWeight: 500 }}>Tip:</strong>{" "}
        Drag a habit chip from the pool and drop it onto another habit — or onto the empty canvas below — to chain them into a stack.
      </p>
      <button
        onClick={onOpenIntro}
        style={{
          flexShrink: 0, padding: "0.35rem 0.8rem",
          background: "transparent", border: "1px solid rgba(232,184,75,0.25)",
          borderRadius: "50px", color: GOLD3,
          fontFamily: SANS, fontSize: "11px", cursor: "pointer",
          transition: "all 0.15s", whiteSpace: "nowrap",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(232,184,75,0.08)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        How it works
      </button>
    </div>
  );
}

/* ════════════════════════════════════════════════════
   MAIN VIEW
   Props: { habits, stacks, setStacks, userId }
   ════════════════════════════════════════════════════ */
export default function StackingView({ habits, stacks, setStacks, userId }) {
  const [showIntro, setShowIntro] = useState(false);
  const [dragging, setDragging]   = useState(null); // { habitId, srcStackId: string|"pool" }
  const [dropTarget, setDropTarget] = useState(null);

  /* First-visit intro */
  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("stackr-stacking-intro-seen")) {
      setShowIntro(true);
    }
  }, []);

  function closeIntro() {
    if (typeof window !== "undefined") localStorage.setItem("stackr-stacking-intro-seen", "1");
    setShowIntro(false);
  }

  /* ── Derived ── */
  const stackedIds   = new Set(stacks.flatMap((s) => s.habitIds));
  const poolHabits   = habits.filter((h) => !stackedIds.has(h.id));
  const hasRealStack = stacks.some((s) => s.habitIds.length >= 2);

  function habitName(id) {
    return habits.find((h) => h.id === id)?.name ?? id;
  }

  /* ── Drop logic (atomic: work on local copy, setStacks once) ── */
  function onDrop(e, target) {
    e.preventDefault();
    const habitId     = e.dataTransfer.getData("habitId");
    const srcStackId  = e.dataTransfer.getData("srcStackId"); // "pool" or stackId
    if (!habitId) { setDragging(null); setDropTarget(null); return; }

    // Parse target: "newstack" | "append|{id}" | "insert|{id}|{index}"
    const [type, tStackId, tIdxStr] = target.split("|");
    const tIdx = tIdxStr !== undefined ? parseInt(tIdxStr) : null;

    let ns = stacks;

    // Step 1 — remove from source stack if applicable
    if (srcStackId !== "pool") {
      const src = ns.find((s) => s.id === srcStackId);
      if (src) {
        const newIds = src.habitIds.filter((id) => id !== habitId);
        if (newIds.length === 0) {
          ns = ns.filter((s) => s.id !== srcStackId);
          if (userId) deleteStackDb(userId, srcStackId);
        } else {
          ns = ns.map((s) => s.id === srcStackId ? { ...s, habitIds: newIds } : s);
          if (userId) updateStackDb(userId, { ...src, habitIds: newIds });
        }
      }
    }

    // Step 2 — apply to destination
    if (type === "newstack") {
      const created = { id: `s${Date.now()}`, habitIds: [habitId], createdAt: new Date().toISOString() };
      ns = [...ns, created];
      if (userId) insertStackDb(userId, created);

    } else if (type === "append") {
      ns = ns.map((s) => s.id === tStackId ? { ...s, habitIds: [...s.habitIds, habitId] } : s);
      const updated = ns.find((s) => s.id === tStackId);
      if (userId && updated) updateStackDb(userId, updated);

    } else if (type === "insert") {
      ns = ns.map((s) => {
        if (s.id !== tStackId) return s;
        const ids = [...s.habitIds];
        // If reordering within same stack, tIdx already accounts for the prior removal above
        ids.splice(tIdx, 0, habitId);
        return { ...s, habitIds: ids };
      });
      const updated = ns.find((s) => s.id === tStackId);
      if (userId && updated) updateStackDb(userId, updated);
    }

    setStacks(ns);
    setDragging(null);
    setDropTarget(null);
  }

  function removeFromStack(stackId, habitId) {
    const stack = stacks.find((s) => s.id === stackId);
    if (!stack) return;
    const newIds = stack.habitIds.filter((id) => id !== habitId);
    if (newIds.length === 0) {
      setStacks((prev) => prev.filter((s) => s.id !== stackId));
      if (userId) deleteStackDb(userId, stackId);
    } else {
      const updated = { ...stack, habitIds: newIds };
      setStacks((prev) => prev.map((s) => s.id === stackId ? updated : s));
      if (userId) updateStackDb(userId, updated);
    }
  }

  function moveInStack(stackId, habitId, dir) {
    const stack = stacks.find((s) => s.id === stackId);
    if (!stack) return;
    const idx    = stack.habitIds.indexOf(habitId);
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= stack.habitIds.length) return;
    const ids  = [...stack.habitIds];
    [ids[idx], ids[newIdx]] = [ids[newIdx], ids[idx]];
    const updated = { ...stack, habitIds: ids };
    setStacks((prev) => prev.map((s) => s.id === stackId ? updated : s));
    if (userId) updateStackDb(userId, updated);
  }

  function deleteStack(stackId) {
    setStacks((prev) => prev.filter((s) => s.id !== stackId));
    if (userId) deleteStackDb(userId, stackId);
  }

  /* ── Arrow connector SVG ── */
  const Arrow = () => (
    <svg width="22" height="12" viewBox="0 0 22 12" fill="none" style={{ flexShrink: 0 }}>
      <path d="M2 6h15M14 2l6 4-6 4" stroke={ACCENT3} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  /* ── Insert drop slot (appears between habits while dragging) ── */
  const DropSlot = ({ stackId, index }) => {
    const key    = `insert|${stackId}|${index}`;
    const active = dropTarget === key;
    return (
      <div
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDropTarget(key); }}
        onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setDropTarget((p) => p === key ? null : p); }}
        onDrop={(e) => { e.stopPropagation(); onDrop(e, key); }}
        style={{
          width: active ? "36px" : "14px",
          minWidth: active ? "36px" : "14px",
          height: "34px",
          display: "flex", alignItems: "center", justifyContent: "center",
          borderRadius: "6px",
          background: active ? "rgba(90,158,114,0.14)" : "transparent",
          border: `1px solid ${active ? ACCENT3 : "transparent"}`,
          transition: "all 0.15s",
          flexShrink: 0,
        }}
      >
        {active && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M5 1v8M1 5h8" stroke={ACCENT3} strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        )}
      </div>
    );
  };

  /* ════════════════════════════════════════════════════
     RENDER
     ════════════════════════════════════════════════════ */
  return (
    <div style={{ padding: "2.5rem 2.5rem 2.5rem 2rem", maxWidth: "780px" }}>
      {showIntro && <IntroOverlay onClose={closeIntro} />}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.5rem" }}>
        <div>
          <div style={{ fontSize: "9px", fontWeight: 500, letterSpacing: "2.5px", textTransform: "uppercase", color: GOLD3, marginBottom: "5px" }}>
            Stacking
          </div>
          <h2 style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: "28px", fontWeight: 400, color: PARCHMENT, margin: 0 }}>
            Habit Stacking
          </h2>
        </div>
        <button
          onClick={() => setShowIntro(true)}
          style={{
            padding: "0.4rem 0.9rem", marginTop: "4px",
            background: "transparent", border: `1px solid ${BORDER2}`,
            borderRadius: "50px", color: MUTED,
            fontFamily: SANS, fontSize: "11px", cursor: "pointer",
            transition: "all 0.15s", whiteSpace: "nowrap",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = PARCHMENT; e.currentTarget.style.borderColor = "rgba(246,241,232,0.28)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = MUTED; e.currentTarget.style.borderColor = BORDER2; }}
        >
          ? How it works
        </button>
      </div>

      <p style={{ fontSize: "13px", color: MUTED, lineHeight: 1.7, maxWidth: "480px", marginBottom: "1.75rem" }}>
        Chain habits together. After you complete one, the next fires automatically — system-driven, not motivation-driven.
      </p>

      {/* Tip card */}
      {!hasRealStack && <TipCard onOpenIntro={() => setShowIntro(true)} />}

      {habits.length < 2 ? (
        <div style={{ padding: "2rem", background: "rgba(246,241,232,0.03)", border: `1px solid ${BORDER}`, borderRadius: "10px", maxWidth: "440px" }}>
          <p style={{ fontSize: "13px", color: MUTED, lineHeight: 1.75, margin: 0 }}>
            Add at least two habits to build a stack.
          </p>
        </div>
      ) : (
        <>
          {/* ── Pool ── */}
          <section style={{ marginBottom: "2rem" }}>
            <div style={{ fontSize: "9px", fontWeight: 500, letterSpacing: "2.5px", textTransform: "uppercase", color: DIM, marginBottom: "0.7rem" }}>
              Available Habits{poolHabits.length > 0 ? ` (${poolHabits.length})` : " · all stacked ✓"}
            </div>

            {poolHabits.length === 0 ? (
              <p style={{ fontSize: "12px", color: DIM, fontStyle: "italic", margin: 0 }}>
                Every habit is in a stack.
              </p>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {poolHabits.map((h) => (
                  <div
                    key={h.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = "move";
                      e.dataTransfer.setData("habitId", h.id);
                      e.dataTransfer.setData("srcStackId", "pool");
                      setDragging({ habitId: h.id, srcStackId: "pool" });
                    }}
                    onDragEnd={() => { setDragging(null); setDropTarget(null); }}
                    style={{
                      padding: "0.5rem 1rem",
                      background: dragging?.habitId === h.id ? "rgba(90,158,114,0.06)" : "rgba(246,241,232,0.04)",
                      border: `1px solid ${dragging?.habitId === h.id ? ACCENT3 : BORDER2}`,
                      borderRadius: "8px",
                      color: PARCHMENT, fontFamily: SANS, fontSize: "13px",
                      cursor: "grab", userSelect: "none",
                      opacity: dragging?.habitId === h.id ? 0.45 : 1,
                      boxShadow: dragging?.habitId === h.id ? "none" : "0 2px 8px rgba(0,0,0,0.15)",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => { if (dragging?.habitId !== h.id) { e.currentTarget.style.borderColor = ACCENT3; e.currentTarget.style.background = "rgba(90,158,114,0.07)"; } }}
                    onMouseLeave={(e) => { if (dragging?.habitId !== h.id) { e.currentTarget.style.borderColor = BORDER2; e.currentTarget.style.background = "rgba(246,241,232,0.04)"; } }}
                  >
                    {h.name}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ── Stacks Canvas ── */}
          <section>
            <div style={{ fontSize: "9px", fontWeight: 500, letterSpacing: "2.5px", textTransform: "uppercase", color: DIM, marginBottom: "0.7rem" }}>
              Your Stacks{stacks.length > 0 ? ` (${stacks.length})` : ""}
            </div>

            {/* Existing stacks */}
            {stacks.map((s, si) => {
              const isStackDrop = dropTarget === `append|${s.id}`;
              const isDraggingCompatible = dragging && !s.habitIds.includes(dragging.habitId);

              return (
                <div
                  key={s.id}
                  style={{
                    marginBottom: "10px",
                    padding: "0.85rem 1rem",
                    background: isStackDrop ? "rgba(90,158,114,0.04)" : "rgba(246,241,232,0.025)",
                    border: `1px solid ${isStackDrop ? ACCENT3 : BORDER}`,
                    borderRadius: "12px",
                    transition: "border-color 0.15s, background 0.15s",
                  }}
                  onDragOver={(e) => { e.preventDefault(); if (!dropTarget?.startsWith("insert|")) setDropTarget(`append|${s.id}`); }}
                  onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setDropTarget((p) => p === `append|${s.id}` ? null : p); }}
                  onDrop={(e) => { if (!dropTarget?.startsWith("insert|")) onDrop(e, `append|${s.id}`); }}
                >
                  {/* Stack label + delete */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
                    <span style={{ fontSize: "9px", fontWeight: 500, letterSpacing: "2px", textTransform: "uppercase", color: DIM }}>
                      Stack {si + 1}
                    </span>
                    <button
                      onClick={() => deleteStack(s.id)}
                      style={{ background: "none", border: "none", color: DIM, cursor: "pointer", fontSize: "15px", lineHeight: 1, padding: "0 2px", transition: "color 0.15s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(220,100,100,0.7)")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = DIM)}
                      aria-label="Delete stack"
                    >
                      ×
                    </button>
                  </div>

                  {/* Chain row */}
                  <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "4px" }}>
                    {/* Leading insert slot */}
                    {dragging && isDraggingCompatible && (
                      <DropSlot stackId={s.id} index={0} />
                    )}

                    {s.habitIds.map((hId, hi) => {
                      const isThisChip = dragging?.habitId === hId;
                      return (
                        <div key={hId} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          {/* Habit chip */}
                          <div
                            draggable
                            onDragStart={(e) => {
                              e.stopPropagation();
                              e.dataTransfer.effectAllowed = "move";
                              e.dataTransfer.setData("habitId", hId);
                              e.dataTransfer.setData("srcStackId", s.id);
                              setDragging({ habitId: hId, srcStackId: s.id });
                            }}
                            onDragEnd={() => { setDragging(null); setDropTarget(null); }}
                            style={{
                              display: "flex", alignItems: "center", gap: "6px",
                              padding: "0.4rem 0.8rem",
                              background: isThisChip ? "rgba(90,158,114,0.05)" : "rgba(90,158,114,0.08)",
                              border: `1px solid ${isThisChip ? "rgba(90,158,114,0.15)" : "rgba(90,158,114,0.28)"}`,
                              borderRadius: "8px",
                              color: PARCHMENT, fontFamily: SANS, fontSize: "13px",
                              cursor: "grab", userSelect: "none",
                              opacity: isThisChip ? 0.4 : 1,
                              transition: "all 0.15s",
                            }}
                          >
                            {/* Reorder arrows */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
                              <button
                                onClick={(e) => { e.stopPropagation(); moveInStack(s.id, hId, -1); }}
                                disabled={hi === 0}
                                aria-label="Move left"
                                style={{ background: "none", border: "none", color: hi === 0 ? "transparent" : DIM, cursor: hi === 0 ? "default" : "pointer", lineHeight: 1, padding: 0, fontSize: "8px", display: "block" }}
                              >▲</button>
                              <button
                                onClick={(e) => { e.stopPropagation(); moveInStack(s.id, hId, 1); }}
                                disabled={hi === s.habitIds.length - 1}
                                aria-label="Move right"
                                style={{ background: "none", border: "none", color: hi === s.habitIds.length - 1 ? "transparent" : DIM, cursor: hi === s.habitIds.length - 1 ? "default" : "pointer", lineHeight: 1, padding: 0, fontSize: "8px", display: "block" }}
                              >▼</button>
                            </div>

                            <span>{habitName(hId)}</span>

                            {/* Remove from stack */}
                            <button
                              onClick={(e) => { e.stopPropagation(); removeFromStack(s.id, hId); }}
                              style={{ background: "none", border: "none", color: DIM, cursor: "pointer", fontSize: "13px", lineHeight: 1, padding: "0 1px", marginLeft: "2px", transition: "color 0.15s" }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(220,100,100,0.8)")}
                              onMouseLeave={(e) => (e.currentTarget.style.color = DIM)}
                              aria-label="Remove from stack"
                            >
                              ×
                            </button>
                          </div>

                          {/* Arrow OR insert slot after chip */}
                          {hi < s.habitIds.length - 1 && (
                            isDraggingCompatible
                              ? <DropSlot stackId={s.id} index={hi + 1} />
                              : <Arrow />
                          )}
                          {/* Trailing slot after last chip (when dragging) */}
                          {hi === s.habitIds.length - 1 && isDraggingCompatible && (
                            <DropSlot stackId={s.id} index={hi + 1} />
                          )}
                        </div>
                      );
                    })}

                    {/* "Drop to add" ghost — visible while dragging compatible habit */}
                    {isDraggingCompatible && (
                      <div style={{
                        padding: "0.35rem 0.75rem",
                        border: `2px dashed ${isStackDrop ? ACCENT3 : "rgba(90,158,114,0.28)"}`,
                        borderRadius: "8px",
                        color: isStackDrop ? ACCENT3 : "rgba(90,158,114,0.45)",
                        fontFamily: SANS, fontSize: "11px",
                        background: isStackDrop ? "rgba(90,158,114,0.06)" : "transparent",
                        transition: "all 0.15s",
                        pointerEvents: "none",
                      }}>
                        + add here
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* New-stack drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDropTarget("newstack"); }}
              onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setDropTarget((p) => p === "newstack" ? null : p); }}
              onDrop={(e) => onDrop(e, "newstack")}
              style={{
                marginTop: stacks.length > 0 ? "10px" : 0,
                padding: dragging ? "2rem 1.5rem" : "1.25rem 1.5rem",
                border: `2px dashed ${dropTarget === "newstack" ? ACCENT3 : BORDER}`,
                borderRadius: "12px",
                display: "flex", alignItems: "center", justifyContent: "center",
                background: dropTarget === "newstack" ? "rgba(90,158,114,0.06)" : "transparent",
                transition: "all 0.2s",
                cursor: "default",
              }}
            >
              <p style={{
                fontSize: "12px",
                color: dropTarget === "newstack" ? ACCENT3 : DIM,
                fontFamily: SANS, margin: 0, transition: "color 0.2s",
              }}>
                {dragging ? "↓ Drop here to create a new stack" : "+ Drag a habit here to start a new stack"}
              </p>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
