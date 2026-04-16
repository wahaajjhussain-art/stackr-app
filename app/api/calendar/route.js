import { NextResponse } from "next/server";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function addMinutes(timeStr, minutes) {
  const [h, m] = timeStr.split(":").map(Number);
  const totalMins = h * 60 + m + minutes;
  const hh = String(Math.floor(totalMins / 60) % 24).padStart(2, "0");
  const mm = String(totalMins % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

function buildRrule(frequency) {
  if (frequency === "WEEKDAYS") return "RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR";
  if (frequency === "WEEKLY")   return "RRULE:FREQ=WEEKLY";
  return "RRULE:FREQ=DAILY"; // default: DAILY
}

function buildEventBody({ name, cue, reward, gcalSync, timezone }) {
  const { time, duration, frequency } = gcalSync;
  // Anchor to today so the first occurrence is immediately visible
  const today = new Date().toISOString().split("T")[0];
  const endTime = addMinutes(time, duration);

  return {
    summary: name,
    description: [
      cue    ? `Cue: ${cue}`    : null,
      reward ? `Reward: ${reward}` : null,
      "Created by Stackr",
    ]
      .filter(Boolean)
      .join("\n"),
    start: {
      dateTime: `${today}T${time}:00`,
      timeZone: timezone,
    },
    end: {
      dateTime: `${today}T${endTime}:00`,
      timeZone: timezone,
    },
    recurrence: [buildRrule(frequency)],
    reminders: {
      useDefault: false,
      overrides: [{ method: "popup", minutes: 30 }],
    },
  };
}

// ─── POST /api/calendar ───────────────────────────────────────────────────────
// Body: { action: "create" | "delete", token, habit?, eventId? }
// Returns: { eventId } for create, { ok: true } for delete

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { action, token } = body;

  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "Missing calendar token" }, { status: 401 });
  }

  // ── CREATE ──────────────────────────────────────────────────────────────────
  if (action === "create") {
    const { habit, timezone = "UTC" } = body;
    if (!habit?.gcalSync?.time || !habit?.gcalSync?.duration || !habit?.gcalSync?.frequency) {
      return NextResponse.json({ error: "Missing gcalSync fields" }, { status: 400 });
    }

    const eventBody = buildEventBody({
      name:     habit.name,
      cue:      habit.cue,
      reward:   habit.reward,
      gcalSync: habit.gcalSync,
      timezone,
    });

    const res = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventBody),
      }
    );

    const data = await res.json();
    if (!res.ok) {
      console.error("Google Calendar create error:", data);
      return NextResponse.json(
        { error: data?.error?.message || "Calendar API error" },
        { status: res.status }
      );
    }

    return NextResponse.json({ eventId: data.id });
  }

  // ── DELETE ──────────────────────────────────────────────────────────────────
  if (action === "delete") {
    const { eventId } = body;
    if (!eventId || typeof eventId !== "string") {
      return NextResponse.json({ error: "Missing eventId" }, { status: 400 });
    }

    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(eventId)}?sendUpdates=none`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    // 204 = deleted, 410 = already gone — both are fine
    if (!res.ok && res.status !== 410 && res.status !== 204) {
      const text = await res.text();
      console.error("Google Calendar delete error:", res.status, text);
      return NextResponse.json({ error: "Failed to delete event" }, { status: res.status });
    }

    return NextResponse.json({ ok: true });
  }

  // ── UPDATE (replace recurring event) ────────────────────────────────────────
  if (action === "update") {
    const { eventId, habit, timezone = "UTC" } = body;
    if (!eventId || !habit?.gcalSync) {
      return NextResponse.json({ error: "Missing eventId or gcalSync" }, { status: 400 });
    }

    const eventBody = buildEventBody({
      name:     habit.name,
      cue:      habit.cue,
      reward:   habit.reward,
      gcalSync: habit.gcalSync,
      timezone,
    });

    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(eventId)}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventBody),
      }
    );

    const data = await res.json();
    if (!res.ok) {
      console.error("Google Calendar update error:", data);
      return NextResponse.json(
        { error: data?.error?.message || "Calendar API error" },
        { status: res.status }
      );
    }

    return NextResponse.json({ eventId: data.id });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
