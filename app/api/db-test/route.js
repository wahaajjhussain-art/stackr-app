import { createClient } from "@/utils/supabase/client";

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return Response.json({
      ok: false,
      error: "Missing env vars",
      NEXT_PUBLIC_SUPABASE_URL: !!supabaseUrl,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: !!supabaseKey,
    }, { status: 500 });
  }

  const supabase = createClient();
  const testId = `__test_${Date.now()}`;

  // 1. Test INSERT
  const { error: insertErr } = await supabase.from("habits").insert({
    id: testId,
    user_id: "__dbtest__",
    name: "DB Write Test",
    time_slot: "Morning",
    category: "health",
    cue: "",
    reward: "",
  });

  if (insertErr) {
    return Response.json({ ok: false, step: "INSERT", error: insertErr.message, code: insertErr.code }, { status: 500 });
  }

  // 2. Test SELECT
  const { data, error: selectErr } = await supabase.from("habits").select("id").eq("id", testId);
  if (selectErr || !data?.length) {
    return Response.json({ ok: false, step: "SELECT", error: selectErr?.message || "Row not found after insert" }, { status: 500 });
  }

  // 3. Cleanup
  await supabase.from("habits").delete().eq("id", testId);

  return Response.json({ ok: true, message: "INSERT + SELECT + DELETE all passed" });
}
