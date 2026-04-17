import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { fetchReminderPrefs, updateReminderPrefs } from "@/lib/db-server";

export async function GET() {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prefs = await fetchReminderPrefs(session.user.email);
  return NextResponse.json(prefs);
}

export async function PATCH(request) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const updates = {};

  if (typeof body.reminders_enabled === "boolean") {
    updates.reminders_enabled = body.reminders_enabled;
  }
  if (typeof body.reminder_hour === "number" && body.reminder_hour >= 0 && body.reminder_hour <= 23) {
    updates.reminder_hour = body.reminder_hour;
  }
  if (typeof body.timezone === "string" && body.timezone.length > 0 && body.timezone.length < 100) {
    updates.timezone = body.timezone;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  await updateReminderPrefs(session.user.email, updates);
  return NextResponse.json({ ok: true });
}
