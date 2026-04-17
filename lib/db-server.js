import { createClient } from "@supabase/supabase-js";

// Server-side Supabase client for API routes (no cookie context needed).
// Uses SUPABASE_SERVICE_ROLE_KEY if available (bypasses RLS), falls back to anon key.
let _serverDb;
function serverDb() {
  if (!_serverDb) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) throw new Error("Missing Supabase env vars");
    _serverDb = createClient(url, key);
  }
  return _serverDb;
}

/**
 * Fetch all users who should receive a reminder email right now.
 * Matches users whose reminder_hour == the current hour in their timezone,
 * who haven't already been emailed today.
 */
export async function fetchUsersForReminder() {
  // Get all users with reminders enabled and a timezone set
  const { data: users, error } = await serverDb()
    .from("prefs")
    .select("user_id, name, reminder_hour, timezone")
    .eq("reminders_enabled", true)
    .not("timezone", "is", null);

  if (error) {
    console.error("fetchUsersForReminder", error);
    return [];
  }
  if (!users || users.length === 0) return [];

  // Filter to users whose local hour matches their reminder_hour
  const now = new Date();
  const eligible = users.filter((u) => {
    try {
      const localHour = parseInt(
        new Intl.DateTimeFormat("en-US", {
          hour: "numeric",
          hour12: false,
          timeZone: u.timezone,
        }).format(now),
        10
      );
      return localHour === u.reminder_hour;
    } catch {
      return false; // invalid timezone
    }
  });

  if (eligible.length === 0) return [];

  // Get today's day_key for each user in their timezone and filter out already-sent
  const results = [];
  for (const u of eligible) {
    const dayKey = getDayKeyForTimezone(now, u.timezone);
    const { data: existing } = await serverDb()
      .from("reminder_log")
      .select("user_id")
      .eq("user_id", u.user_id)
      .eq("day_key", dayKey)
      .maybeSingle();
    if (!existing) {
      results.push({ ...u, dayKey });
    }
  }

  return results;
}

/**
 * Fetch habits for a user (server-side).
 */
export async function fetchHabitsServer(userId) {
  const { data, error } = await serverDb()
    .from("habits")
    .select("id, name, time_slot, category, cue, reward")
    .eq("user_id", userId)
    .order("created_at");
  if (error) console.error("fetchHabitsServer", error);
  return (data || []).map((r) => ({
    id: r.id,
    name: r.name,
    timeSlot: r.time_slot,
    category: r.category,
  }));
}

/**
 * Fetch intentions for a user (server-side).
 */
export async function fetchIntentionsServer(userId) {
  const { data, error } = await serverDb()
    .from("intentions")
    .select("habit_id, time, location, sentence")
    .eq("user_id", userId);
  if (error) console.error("fetchIntentionsServer", error);
  return data || [];
}

/**
 * Fetch completions for a specific day (server-side).
 */
export async function fetchCompletionsForDay(userId, dayKey) {
  const { data, error } = await serverDb()
    .from("completions")
    .select("habit_id")
    .eq("user_id", userId)
    .eq("day_key", dayKey);
  if (error) console.error("fetchCompletionsForDay", error);
  const set = new Set();
  (data || []).forEach((r) => set.add(r.habit_id));
  return set;
}

/**
 * Log that a reminder was sent to prevent duplicates.
 */
export async function logReminderSent(userId, dayKey) {
  const { error } = await serverDb()
    .from("reminder_log")
    .upsert({ user_id: userId, day_key: dayKey });
  if (error) console.error("logReminderSent", error);
}

/**
 * Fetch reminder preferences for a user.
 */
export async function fetchReminderPrefs(userId) {
  const { data, error } = await serverDb()
    .from("prefs")
    .select("reminders_enabled, reminder_hour, timezone")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) console.error("fetchReminderPrefs", error);
  return data || { reminders_enabled: true, reminder_hour: 8, timezone: null };
}

/**
 * Update reminder preferences for a user.
 */
export async function updateReminderPrefs(userId, { reminders_enabled, reminder_hour, timezone }) {
  const updates = {};
  if (reminders_enabled !== undefined) updates.reminders_enabled = reminders_enabled;
  if (reminder_hour !== undefined) updates.reminder_hour = reminder_hour;
  if (timezone !== undefined) updates.timezone = timezone;
  const { error } = await serverDb()
    .from("prefs")
    .update(updates)
    .eq("user_id", userId);
  if (error) console.error("updateReminderPrefs", error);
}

/**
 * Disable reminders for a user (unsubscribe).
 */
export async function disableReminders(userId) {
  const { error } = await serverDb()
    .from("prefs")
    .update({ reminders_enabled: false })
    .eq("user_id", userId);
  if (error) console.error("disableReminders", error);
}

// Helper: get YYYY-MM-DD day key for a date in a specific timezone
function getDayKeyForTimezone(date, timezone) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
  return parts; // en-CA format is YYYY-MM-DD
}
