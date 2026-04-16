import { createClient } from "@/utils/supabase/client";

function db() {
  return createClient();
}

// ─── HABITS ──────────────────────────────────────────────────────────────────

export async function fetchHabits(userId) {
  const { data, error } = await db()
    .from("habits")
    .select("*")
    .eq("user_id", userId)
    .order("created_at");
  if (error) console.error("fetchHabits", error);
  return (data || []).map((r) => ({
    id: r.id,
    name: r.name,
    timeSlot: r.time_slot,
    category: r.category,
    cue: r.cue,
    reward: r.reward,
    gcalEventId: r.gcal_event_id || null,
    gcalSync: r.gcal_sync || null,
  }));
}

export async function insertHabit(userId, habit) {
  const { error } = await db().from("habits").insert({
    id: habit.id,
    user_id: userId,
    name: habit.name,
    time_slot: habit.timeSlot || "Morning",
    category: habit.category || "health",
    cue: habit.cue || "",
    reward: habit.reward || "",
  });
  if (error) console.error("insertHabit", error);
}

export async function deleteHabitDb(userId, habitId) {
  const { error } = await db()
    .from("habits")
    .delete()
    .eq("id", habitId)
    .eq("user_id", userId);
  if (error) console.error("deleteHabitDb", error);
  // Also remove completions for this habit
  await db()
    .from("completions")
    .delete()
    .eq("habit_id", habitId)
    .eq("user_id", userId);
}

export async function updateHabitDb(userId, habitId, updates) {
  const mapped = {};
  if (updates.timeSlot !== undefined) mapped.time_slot = updates.timeSlot;
  if (updates.name !== undefined) mapped.name = updates.name;
  if (updates.category !== undefined) mapped.category = updates.category;
  if (updates.cue !== undefined) mapped.cue = updates.cue;
  if (updates.reward !== undefined) mapped.reward = updates.reward;
  if (updates.gcalEventId !== undefined) mapped.gcal_event_id = updates.gcalEventId;
  if (updates.gcalSync !== undefined) mapped.gcal_sync = updates.gcalSync;
  const { error } = await db()
    .from("habits")
    .update(mapped)
    .eq("id", habitId)
    .eq("user_id", userId);
  if (error) console.error("updateHabitDb", error);
}

// ─── COMPLETIONS ─────────────────────────────────────────────────────────────
// Stored as flat rows; loaded as { dayKey: { habitId: true } }

export async function fetchCompletions(userId) {
  const { data, error } = await db()
    .from("completions")
    .select("habit_id, day_key")
    .eq("user_id", userId);
  if (error) console.error("fetchCompletions", error);
  const result = {};
  (data || []).forEach(({ habit_id, day_key }) => {
    if (!result[day_key]) result[day_key] = {};
    result[day_key][habit_id] = true;
  });
  return result;
}

export async function toggleCompletionDb(userId, habitId, dayKey, nowCompleted) {
  if (nowCompleted) {
    const { error } = await db()
      .from("completions")
      .upsert({ user_id: userId, habit_id: habitId, day_key: dayKey });
    if (error) console.error("toggleCompletionDb upsert", error);
  } else {
    const { error } = await db()
      .from("completions")
      .delete()
      .eq("user_id", userId)
      .eq("habit_id", habitId)
      .eq("day_key", dayKey);
    if (error) console.error("toggleCompletionDb delete", error);
  }
}

// ─── PREFS ───────────────────────────────────────────────────────────────────

export async function fetchPrefs(userId) {
  const { data, error } = await db()
    .from("prefs")
    .select("name, theme")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) console.error("fetchPrefs", error);
  return data || null; // { name, theme } or null
}

export async function upsertPrefs(userId, prefs) {
  const { error } = await db().from("prefs").upsert({
    user_id: userId,
    name: prefs.name || "",
    theme: prefs.theme || "dark",
    updated_at: new Date().toISOString(),
  });
  if (error) console.error("upsertPrefs", error);
}

// ─── INTENTIONS ──────────────────────────────────────────────────────────────

export async function fetchIntentions(userId) {
  const { data, error } = await db()
    .from("intentions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) console.error("fetchIntentions", error);
  return (data || []).map((r) => ({
    id: r.id,
    time: r.time,
    habitId: r.habit_id,
    habitName: r.habit_name,
    location: r.location,
    sentence: r.sentence,
    createdAt: r.created_at,
    gcalEventId: r.gcal_event_id || null,
    gcalSync: r.gcal_sync || null,
  }));
}

export async function insertIntentionDb(userId, intention) {
  const { error } = await db().from("intentions").insert({
    id: intention.id,
    user_id: userId,
    time: intention.time,
    habit_id: intention.habitId,
    habit_name: intention.habitName,
    location: intention.location,
    sentence: intention.sentence,
    created_at: intention.createdAt,
  });
  if (error) console.error("insertIntentionDb", error);
}

export async function updateIntentionDb(userId, intention) {
  const fields = {
    time: intention.time,
    habit_id: intention.habitId,
    habit_name: intention.habitName,
    location: intention.location,
    sentence: intention.sentence,
  };
  if (intention.gcalEventId !== undefined) fields.gcal_event_id = intention.gcalEventId;
  if (intention.gcalSync !== undefined) fields.gcal_sync = intention.gcalSync;
  const { error } = await db()
    .from("intentions")
    .update(fields)
    .eq("id", intention.id)
    .eq("user_id", userId);
  if (error) console.error("updateIntentionDb", error);
}

export async function deleteIntentionDb(userId, intentionId) {
  const { error } = await db()
    .from("intentions")
    .delete()
    .eq("id", intentionId)
    .eq("user_id", userId);
  if (error) console.error("deleteIntentionDb", error);
}

// ─── NOTES ───────────────────────────────────────────────────────────────────
// Stored as flat rows; loaded as { dayKey: { habitId: [text, …] } }

export async function fetchNotes(userId) {
  const { data, error } = await db()
    .from("notes")
    .select("habit_id, day_key, text")
    .eq("user_id", userId)
    .order("created_at");
  if (error) console.error("fetchNotes", error);
  const result = {};
  (data || []).forEach(({ habit_id, day_key, text }) => {
    if (!result[day_key]) result[day_key] = {};
    if (!result[day_key][habit_id]) result[day_key][habit_id] = [];
    result[day_key][habit_id].push(text);
  });
  return result;
}

export async function insertNoteDb(userId, habitId, dayKey, text) {
  const { error } = await db().from("notes").insert({
    user_id: userId,
    habit_id: habitId,
    day_key: dayKey,
    text,
  });
  if (error) console.error("insertNoteDb", error);
}

// ─── RESET ALL ───────────────────────────────────────────────────────────────

export async function resetAllDb(userId) {
  await Promise.all([
    db().from("habits").delete().eq("user_id", userId),
    db().from("completions").delete().eq("user_id", userId),
    db().from("prefs").delete().eq("user_id", userId),
    db().from("intentions").delete().eq("user_id", userId),
    db().from("notes").delete().eq("user_id", userId),
    db().from("stacks").delete().eq("user_id", userId),
  ]);
}

// ─── STACKS ──────────────────────────────────────────────────────────────────

export async function fetchStacks(userId) {
  const { data, error } = await db()
    .from("stacks")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) console.error("fetchStacks", error);
  return (data || []).map((r) => ({
    id: r.id,
    habitIds: r.habit_ids,
    createdAt: r.created_at,
  }));
}

export async function insertStackDb(userId, stack) {
  const { error } = await db().from("stacks").insert({
    id: stack.id,
    user_id: userId,
    habit_ids: stack.habitIds,
    created_at: stack.createdAt,
  });
  if (error) console.error("insertStackDb", error);
}

export async function updateStackDb(userId, stack) {
  const { error } = await db()
    .from("stacks")
    .update({ habit_ids: stack.habitIds })
    .eq("id", stack.id)
    .eq("user_id", userId);
  if (error) console.error("updateStackDb", error);
}

export async function deleteStackDb(userId, stackId) {
  const { error } = await db()
    .from("stacks")
    .delete()
    .eq("id", stackId)
    .eq("user_id", userId);
  if (error) console.error("deleteStackDb", error);
}
