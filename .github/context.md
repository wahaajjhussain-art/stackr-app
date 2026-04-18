# Stackr — Product Context

## Overview

**Stackr** is a habit tracking application built with a behavioral psychology focus (habit stacking, cue/reward loops, implementation intentions). Deployed on Vercel at `stackr-app-nine.vercel.app`.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.2.3 (App Router) |
| UI | React 19.2.5, inline styles with CSS custom properties |
| Auth | NextAuth 4.24.14 (Google OAuth, JWT sessions) |
| Database | Supabase (PostgreSQL) with RLS |
| Email | Resend 6.12.0 + @react-email/components |
| Styling | Tailwind CSS 4 (minimal), custom CSS variables for theming |
| Deployment | Vercel |

---

## Views

All views live in `app/app/page.js` as inline components:

| View | ID | Purpose |
|------|----|---------|
| Dashboard | `dashboard` | Daily overview — greeting, today's completions, habits by time slot, consistency score, suggestions, restart prompts |
| All Habits | `all-habits` | Table of all habits with streak, completion, notes, bulk actions |
| Add Habit | `add-habit` | Create habit form (name, time slot, category, cue, reward, optional Google Calendar sync) |
| Monthly | `monthly` | Calendar grid with daily completion percentage; click day for breakdown |
| Daily | `daily` | Today's habits by time slot with completion progress bar |
| Stacking | `stacking` | Drag-and-drop habit sequence builder (habit stacking) |
| Analytics | `analytics` | Streaks, weekly rates, 12-week bar chart, year heatmap |
| Implementation | `intention` | Implementation intentions builder ("After [cue], I will [habit] at [time/location]") |
| Review | `review` | Weekly review summary with burndown statistics |
| Login | `/login` | Google OAuth login |
| Landing | `/` | Public marketing page (redirects to `public/landing.html`) |

---

## Components

### Separate files (`app/app/components/`):

| Component | File | Purpose |
|-----------|------|---------|
| ConsistencyScore | `ConsistencyScore.js` | 30-day done/expected completion ratio |
| IntentionBuilder | `IntentionBuilder.js` | Form for creating/editing implementation intentions |
| RestartPrompt | `RestartPrompt.js` | Alert for habits missed ≥2 days |
| ReviewView | `ReviewView.js` | Weekly review with burndown data |
| StackingView | `StackingView.js` | Drag-and-drop + 3-step tutorial for habit sequences |
| SuggestionPanel | `SuggestionPanel.js` | Algorithm-driven suggestions for declining habits |

### Inline components (in `app/app/page.js`):

- **Sidebar** — Navigation drawer with collapsible sections
- **ProgressBar** — Visual completion percentage
- **GCalBadge** — Google Calendar sync status icon
- **HabitRow** — Single habit item with toggle, streak, cue/reward
- **HabitSection** — Group of habits by time slot
- **MiniCalendar** — Month grid with daily completion density
- **YearHeatmap** — GitHub-style contribution heatmap
- **SettingsModal** — Theme, name, timezone, reminders, reset, sign out
- **AddHabitModal** — Add habit form with Google Calendar config
- **HabitDetailRow** — Expandable habit card with notes, sync, delete
- **DashboardSkeleton** — Shimmer loading screen
- **DashboardView, AllHabitsView, DailyView, MonthlyView, AnalyticsView, AddHabitView** — View-level wrappers

---

## Features

### Habit Management
- Create/read/update/delete habits
- Time slot categorization (Morning, Afternoon, Evening)
- Categories: health, mind, work, social, general
- Cue & reward fields (habit loop framework)

### Progress Tracking
- Daily completion toggles
- Streaks (current and best)
- 30-day consistency score
- Weekly completion rates
- 12-week bar chart (weekly aggregates)

### Visualizations
- Mini calendar (monthly view with daily density)
- Year heatmap (GitHub-style, 365 days)
- Progress bars and percentage displays

### Habit Stacking
- Link new habits to existing ones as anchors
- Drag-and-drop reordering
- Multi-habit sequences
- Tutorial overlay for onboarding

### Implementation Intentions
- Template: "After [location/time], I will [habit]"
- Time, location, habit, and sentence fields
- Optional Google Calendar sync

### Google Calendar Integration
- Sync habits and intentions to personal calendar
- Configurable: time, duration, frequency (DAILY/WEEKLY/WEEKDAYS)
- Recurring events with stored event ID

### Notes & Journaling
- Per-habit, per-day notes
- Stored against day_key (YYYY-MM-DD)

### Settings & Preferences
- Display name, theme toggle (dark/light)
- Email reminder settings (hour, timezone, enable/disable)
- Account reset (transactional delete all user data)
- Google OAuth sign out

### Email Reminders (server-side)
- Daily digest email with habit summary
- Timezone-aware scheduling, cron-triggered
- One email per user per day (deduplication via `reminder_log`)
- Unsubscribe via HMAC-signed link

### Review & Guidance
- Weekly review burndown
- Restart prompts for missed habits (≥2 days)
- Actionable suggestions for declining habits

---

## API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/auth/[...nextauth]` | GET/POST | Google OAuth handler, JWT sessions |
| `/api/calendar` | POST | Google Calendar sync for habits & intentions |
| `/api/reminders/send` | GET | Cron endpoint — send daily digest emails to eligible users |
| `/api/reminders/preferences` | GET/PATCH | User reminder preferences |
| `/api/reminders/unsubscribe` | GET | One-click unsubscribe (HMAC token) |
| `/api/db-test` | GET | Dev-only Supabase connection test |

---

## Database Schema

| Table | Key Columns | Purpose |
|-------|-------------|---------|
| `habits` | id, user_id, name, time_slot, category, cue, reward, gcal_event_id, gcal_sync | Main habits |
| `completions` | user_id, habit_id, day_key | Daily completion records (composite PK) |
| `prefs` | user_id (PK), name, theme, reminders_enabled, reminder_hour, timezone | User preferences |
| `intentions` | id, user_id, time, habit_id, habit_name, location, sentence, gcal_event_id | Implementation intentions |
| `notes` | id (UUID), user_id, habit_id, day_key, text | Per-habit per-day notes |
| `stacks` | id, user_id, habit_ids (JSONB) | Habit sequences |
| `reminder_log` | user_id, day_key (PK), sent_at | Email deduplication |

**Functions:** `update_timestamp()`, `reset_user_data(uid)`
**Views:** `user_analytics` (admin analytics)

---

## Key Files

| File | Purpose |
|------|---------|
| `app/app/page.js` | Main dashboard — all views, state, theme switching |
| `lib/db.js` | Client-side database layer (Supabase) |
| `lib/db-server.js` | Server-side database layer (service role key) |
| `lib/email.js` | Resend API wrapper |
| `utils/supabase/client.js` | Supabase browser client |
| `utils/supabase/server.js` | Supabase SSR client |
| `utils/supabase/middleware.js` | Auth cookie middleware |
| `proxy.js` | NextAuth middleware guarding `/app/*` |
| `app/emails/DailyDigest.jsx` | React Email daily reminder component |
| `app/layout.js` | Root layout with theme/auth providers |
| `app/providers.js` | SessionProvider + theme context |
| `app/globals.css` | CSS custom properties for dark/light theme |
| `public/landing.html` | Marketing landing page |
| `public/intro.css` | Landing page styles |

---

## Design System

### Theme Variables (CSS custom properties)
- **Backgrounds:** `--s-bg`, `--s-card`, `--s-surface`
- **Text:** `--s-text`, `--s-muted`, `--s-dim`, `--s-faint`
- **Borders:** `--s-border`, `--s-border2`
- **Accent:** Greens (#1E4D30, #2F6B43, #5A9E72)
- **Gold:** #9A6B1E, #E8B84B

### Typography
- **Serif:** 'Cormorant Garamond' — headings
- **Sans:** 'DM Sans' — body
- **Mono:** 'DM Mono' — data/time

### Mobile Breakpoints
- Dashboard: 680px
- Landing page: 700px

---

## Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server | Service role for server-side DB |
| `NEXTAUTH_SECRET` | Yes | JWT signing secret |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth |
| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth |
| `RESEND_API_KEY` | Yes | Email sending |
| `RESEND_FROM_DOMAIN` | No | Defaults to resend.dev |
| `CRON_SECRET` | No | Guard for `/reminders/send` cron |
| `NEXT_PUBLIC_APP_URL` | No | Base URL for email links |

---

## Scripts

```bash
npm run dev      # Local development
npm run build    # Production build
npm run start    # Production server
npm run lint     # ESLint
```
