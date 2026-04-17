import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Link,
  Hr,
  Img,
  Row,
  Column,
  Preview,
} from "@react-email/components";
import * as React from "react";

// ── Design tokens matching the app ──
const INK = "#16140F";
const INK2 = "#1E1C16";
const PARCHMENT = "#E8E0D0";
const DIM = "#8A8474";
const ACCENT = "#1E4D30";
const ACCENT2 = "#2F6B43";
const GOLD = "#E8B84B";
const BORDER = "rgba(232,224,208,0.08)";

const CATEGORY_COLORS = {
  health: "#2F6B43",
  mind: "#4A6FA5",
  work: "#B8860B",
  social: "#8B5E3C",
  general: "#6B6B6B",
};

const TIME_SLOT_LABELS = {
  Morning: "Morning",
  Afternoon: "Afternoon",
  Evening: "Evening",
};

const TIME_SLOT_EMOJI = {
  Morning: "☀️",
  Afternoon: "🌤️",
  Evening: "🌙",
};

export default function DailyDigest({
  userName = "there",
  dateLabel = "Today",
  habits = [],
  intentions = [],
  completedIds = [],
  appUrl = "https://localhost:3000/app",
  unsubscribeUrl = "",
}) {
  // Group habits by time slot
  const grouped = { Morning: [], Afternoon: [], Evening: [] };
  habits.forEach((h) => {
    const slot = grouped[h.timeSlot] ? h.timeSlot : "Morning";
    grouped[slot].push(h);
  });

  // Map intentions by habit_id for quick lookup
  const intentionMap = {};
  intentions.forEach((i) => {
    if (i.habit_id) intentionMap[i.habit_id] = i;
  });

  const completedSet = new Set(completedIds);
  const pendingHabits = habits.filter((h) => !completedSet.has(h.id));
  const pendingCount = pendingHabits.length;
  const totalCount = habits.length;

  // Greeting based on time (fallback to "Good morning")
  const greeting = `Good morning, ${userName}`;

  return (
    <Html>
      <Head>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&family=DM+Sans:wght@300;400;500&display=swap');
        `}</style>
      </Head>
      <Preview>
        {pendingCount > 0
          ? `You have ${pendingCount} habit${pendingCount !== 1 ? "s" : ""} lined up today — ${dateLabel}`
          : `All habits complete! Great work — ${dateLabel}`}
      </Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          {/* ── Header ── */}
          <Section style={headerSection}>
            {/* Logo: 4-bar gradient wordmark */}
            <Text style={logoStyle}>STACKR</Text>
          </Section>

          {/* ── Greeting ── */}
          <Section style={{ padding: "0 32px" }}>
            <Text style={greetingStyle}>{greeting}</Text>
            <Text style={dateStyle}>{dateLabel}</Text>
            {pendingCount > 0 ? (
              <Text style={subtitleStyle}>
                You have <span style={{ color: GOLD, fontWeight: 500 }}>{pendingCount}</span> habit{pendingCount !== 1 ? "s" : ""} to
                complete today. Here&apos;s your plan:
              </Text>
            ) : (
              <Text style={subtitleStyle}>
                All {totalCount} habits are already done! 🎉 Amazing consistency.
              </Text>
            )}
          </Section>

          {/* ── Habits by time slot ── */}
          {["Morning", "Afternoon", "Evening"].map((slot) => {
            const slotHabits = grouped[slot];
            if (!slotHabits || slotHabits.length === 0) return null;
            const slotPending = slotHabits.filter((h) => !completedSet.has(h.id));
            if (slotPending.length === 0) return null;

            return (
              <Section key={slot} style={slotSection}>
                <Text style={slotHeader}>
                  {TIME_SLOT_EMOJI[slot]} {TIME_SLOT_LABELS[slot]}
                </Text>
                {slotPending.map((habit) => {
                  const intention = intentionMap[habit.id];
                  const catColor = CATEGORY_COLORS[habit.category] || CATEGORY_COLORS.general;
                  return (
                    <div key={habit.id} style={habitRow(catColor)}>
                      <table width="100%" cellPadding="0" cellSpacing="0" style={{ borderCollapse: "collapse" }}>
                        <tr>
                          <td width="28" style={{ verticalAlign: "top", paddingTop: "2px" }}>
                            <div style={checkboxStyle}>
                              <div style={checkboxInner} />
                            </div>
                          </td>
                          <td style={{ verticalAlign: "top" }}>
                            <Text style={habitName}>{habit.name}</Text>
                            {intention && (
                              <Text style={intentionStyle}>
                                {intention.time && `${intention.time}`}
                                {intention.time && intention.location && " · "}
                                {intention.location && `at ${intention.location}`}
                              </Text>
                            )}
                          </td>
                          <td width="60" style={{ verticalAlign: "top", textAlign: "right" }}>
                            <Text style={categoryBadge(catColor)}>
                              {habit.category}
                            </Text>
                          </td>
                        </tr>
                      </table>
                    </div>
                  );
                })}
              </Section>
            );
          })}

          {/* ── CTA Button ── */}
          <Section style={{ padding: "8px 32px 0" }}>
            <table width="100%" cellPadding="0" cellSpacing="0" style={{ borderCollapse: "collapse" }}>
              <tr>
                <td align="center">
                  <Link href={appUrl} style={ctaButton}>
                    {pendingCount > 0 ? "Mark Habits Complete →" : "View Your Tracker →"}
                  </Link>
                </td>
              </tr>
            </table>
          </Section>

          {/* ── Motivational quote ── */}
          <Section style={{ padding: "24px 32px 0" }}>
            <Text style={quoteStyle}>
              "We are what we repeatedly do. Excellence, then, is not an act, but a habit."
            </Text>
            <Text style={quoteAuthor}>— Aristotle</Text>
          </Section>

          {/* ── Footer ── */}
          <Hr style={hrStyle} />
          <Section style={footerSection}>
            <Text style={footerText}>
              You&apos;re receiving this because you have email reminders enabled on Stackr.
            </Text>
            {unsubscribeUrl && (
              <Text style={footerText}>
                <Link href={unsubscribeUrl} style={unsubLink}>
                  Turn off email reminders
                </Link>
              </Text>
            )}
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// ── Styles ──

const bodyStyle = {
  backgroundColor: "#0F0E0A",
  margin: 0,
  padding: "40px 0",
  fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
};

const containerStyle = {
  maxWidth: "560px",
  margin: "0 auto",
  backgroundColor: INK,
  borderRadius: "16px",
  border: `1px solid rgba(232,224,208,0.06)`,
  overflow: "hidden",
};

const headerSection = {
  padding: "32px 32px 0",
  textAlign: "center",
};

const logoStyle = {
  fontSize: "16px",
  fontWeight: 500,
  letterSpacing: "5px",
  color: ACCENT2,
  margin: "0 0 4px",
  fontFamily: "'DM Sans', sans-serif",
};

const greetingStyle = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  fontStyle: "italic",
  fontSize: "28px",
  fontWeight: 400,
  color: PARCHMENT,
  margin: "24px 0 4px",
  lineHeight: "1.2",
};

const dateStyle = {
  fontSize: "13px",
  color: DIM,
  margin: "0 0 16px",
  letterSpacing: "0.3px",
};

const subtitleStyle = {
  fontSize: "14px",
  color: "rgba(232,224,208,0.7)",
  margin: "0 0 8px",
  lineHeight: "1.5",
};

const slotSection = {
  padding: "16px 32px 0",
};

const slotHeader = {
  fontSize: "11px",
  fontWeight: 500,
  textTransform: "uppercase",
  letterSpacing: "1.8px",
  color: DIM,
  margin: "0 0 10px",
};

function habitRow(catColor) {
  return {
    backgroundColor: INK2,
    borderRadius: "10px",
    padding: "14px 16px",
    marginBottom: "8px",
    borderLeft: `3px solid ${catColor}`,
  };
}

const checkboxStyle = {
  width: "18px",
  height: "18px",
  borderRadius: "50%",
  border: `2px solid ${DIM}`,
  display: "inline-block",
};

const checkboxInner = {
  width: "100%",
  height: "100%",
};

const habitName = {
  fontSize: "15px",
  fontWeight: 400,
  color: PARCHMENT,
  margin: "0",
  lineHeight: "1.3",
};

const intentionStyle = {
  fontSize: "12px",
  color: DIM,
  margin: "3px 0 0",
  lineHeight: "1.3",
};

function categoryBadge(color) {
  return {
    fontSize: "9px",
    fontWeight: 500,
    textTransform: "uppercase",
    letterSpacing: "1px",
    color: color,
    opacity: 0.8,
    margin: "2px 0 0",
  };
}

const ctaButton = {
  display: "inline-block",
  backgroundColor: ACCENT,
  color: "#fff",
  fontSize: "14px",
  fontWeight: 500,
  padding: "14px 36px",
  borderRadius: "10px",
  textDecoration: "none",
  textAlign: "center",
  letterSpacing: "0.3px",
  marginTop: "8px",
};

const quoteStyle = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  fontStyle: "italic",
  fontSize: "14px",
  color: "rgba(232,224,208,0.4)",
  textAlign: "center",
  margin: "0",
  lineHeight: "1.5",
};

const quoteAuthor = {
  fontSize: "11px",
  color: "rgba(232,224,208,0.25)",
  textAlign: "center",
  margin: "4px 0 0",
};

const hrStyle = {
  borderColor: "rgba(232,224,208,0.06)",
  borderWidth: "1px 0 0 0",
  margin: "28px 32px 0",
};

const footerSection = {
  padding: "20px 32px 28px",
  textAlign: "center",
};

const footerText = {
  fontSize: "11px",
  color: "rgba(232,224,208,0.3)",
  margin: "0 0 6px",
  lineHeight: "1.5",
};

const unsubLink = {
  color: "rgba(232,224,208,0.4)",
  textDecoration: "underline",
  fontSize: "11px",
};
