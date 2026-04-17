import { NextResponse } from "next/server";
import { disableReminders } from "@/lib/db-server";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const uid = searchParams.get("uid");
  const token = searchParams.get("token");

  if (!uid || !token) {
    return htmlResponse("Invalid Link", "This unsubscribe link is missing required parameters.", 400);
  }

  // Verify HMAC token
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    return htmlResponse("Server Error", "Server configuration error.", 500);
  }

  const expected = crypto.createHmac("sha256", secret).update(uid).digest("hex");
  if (!crypto.timingSafeEqual(Buffer.from(token, "hex"), Buffer.from(expected, "hex"))) {
    return htmlResponse("Invalid Link", "This unsubscribe link is invalid or expired.", 403);
  }

  await disableReminders(uid);

  return htmlResponse(
    "Reminders Turned Off",
    "You've been unsubscribed from Stackr daily email reminders. You can re-enable them anytime from the app settings.",
    200
  );
}

function htmlResponse(title, message, status) {
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title} — Stackr</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@1,400&family=DM+Sans:wght@300;400;500&display=swap');
    body {
      margin: 0;
      padding: 0;
      background: #0F0E0A;
      color: #E8E0D0;
      font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
    }
    .card {
      text-align: center;
      max-width: 420px;
      padding: 48px 32px;
      background: #16140F;
      border-radius: 16px;
      border: 1px solid rgba(232,224,208,0.06);
      margin: 20px;
    }
    h1 {
      font-family: 'Cormorant Garamond', Georgia, serif;
      font-style: italic;
      font-weight: 400;
      font-size: 28px;
      margin: 0 0 12px;
      color: #E8E0D0;
    }
    p {
      font-size: 14px;
      line-height: 1.6;
      color: rgba(232,224,208,0.6);
      margin: 0 0 24px;
    }
    a {
      display: inline-block;
      background: #1E4D30;
      color: #fff;
      padding: 12px 28px;
      border-radius: 8px;
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
    }
    a:hover { background: #2F6B43; }
    .logo {
      font-size: 14px;
      font-weight: 500;
      letter-spacing: 4px;
      color: #2F6B43;
      margin-bottom: 24px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">STACKR</div>
    <h1>${title}</h1>
    <p>${message}</p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL || "/"}/app">Open Stackr</a>
  </div>
</body>
</html>`;

  return new Response(html, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
