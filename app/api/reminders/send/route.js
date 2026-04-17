import { NextResponse } from "next/server";
import { createElement } from "react";
import { sendDigestEmail } from "@/lib/email";
import {
  fetchUsersForReminder,
  fetchHabitsServer,
  fetchIntentionsServer,
  fetchCompletionsForDay,
  logReminderSent,
} from "@/lib/db-server";
import DailyDigest from "@/app/emails/DailyDigest";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function GET(request) {
  // ── Verify cron secret ──
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  try {
    const users = await fetchUsersForReminder();

    if (users.length === 0) {
      return NextResponse.json({ sent: 0, skipped: 0, message: "No users due for reminder" });
    }

    let sent = 0;
    let skipped = 0;

    // Process in batches of 10
    for (let i = 0; i < users.length; i += 10) {
      const batch = users.slice(i, i + 10);

      await Promise.all(
        batch.map(async (user) => {
          try {
            const [habits, intentions, completedSet] = await Promise.all([
              fetchHabitsServer(user.user_id),
              fetchIntentionsServer(user.user_id),
              fetchCompletionsForDay(user.user_id, user.dayKey),
            ]);

            // Skip if no habits or all already completed
            if (habits.length === 0) {
              skipped++;
              return;
            }

            const pendingHabits = habits.filter((h) => !completedSet.has(h.id));
            if (pendingHabits.length === 0) {
              skipped++;
              return;
            }

            // Build unsubscribe URL with HMAC token
            const unsubToken = generateUnsubToken(user.user_id);
            const unsubscribeUrl = `${appUrl}/api/reminders/unsubscribe?uid=${encodeURIComponent(user.user_id)}&token=${unsubToken}`;

            // Format date label in user's timezone
            const dateLabel = formatDateLabel(new Date(), user.timezone);

            const userName = user.name || user.user_id.split("@")[0];

            // Build email subject
            const subject = `${pendingHabits.length} habit${pendingHabits.length !== 1 ? "s" : ""} lined up today — ${userName}`;

            const emailElement = createElement(DailyDigest, {
              userName,
              dateLabel,
              habits,
              intentions,
              completedIds: [...completedSet],
              appUrl: `${appUrl}/app`,
              unsubscribeUrl,
            });

            await sendDigestEmail(user.user_id, subject, emailElement);
            await logReminderSent(user.user_id, user.dayKey);
            sent++;
          } catch (err) {
            console.error(`Failed to send reminder to ${user.user_id}:`, err);
            skipped++;
          }
        })
      );
    }

    return NextResponse.json({ sent, skipped, total: users.length });
  } catch (err) {
    console.error("Cron /api/reminders/send error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

function generateUnsubToken(userId) {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET not set");
  return crypto.createHmac("sha256", secret).update(userId).digest("hex");
}

function formatDateLabel(date, timezone) {
  try {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: timezone,
    }).format(date);
  } catch {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
}
