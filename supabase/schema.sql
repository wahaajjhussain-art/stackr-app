-- ─────────────────────────────────────────────────────────────
-- Stackr — Supabase schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ─────────────────────────────────────────────────────────────

-- 1. HABITS
create table if not exists habits (
  id          text        primary key,
  user_id     text        not null,
  name        text        not null,
  time_slot   text        not null default 'Morning',
  category    text        not null default 'health',
  cue         text        not null default '',
  reward      text        not null default '',
  created_at  timestamptz not null default now()
);
alter table habits enable row level security;
create policy "habits_open" on habits for all using (true) with check (true);
create index if not exists habits_user_idx on habits (user_id);

-- Google Calendar sync (added after initial deploy)
-- Run this migration separately if the table already exists:
-- ALTER TABLE habits ADD COLUMN IF NOT EXISTS gcal_event_id TEXT;
-- ALTER TABLE habits ADD COLUMN IF NOT EXISTS gcal_sync JSONB;
alter table habits add column if not exists gcal_event_id text;
alter table habits add column if not exists gcal_sync jsonb;

-- 2. COMPLETIONS
create table if not exists completions (
  user_id     text  not null,
  habit_id    text  not null,
  day_key     text  not null,   -- YYYY-MM-DD
  primary key (user_id, habit_id, day_key)
);
alter table completions enable row level security;
create policy "completions_open" on completions for all using (true) with check (true);
create index if not exists completions_user_idx on completions (user_id);

-- 3. PREFS
create table if not exists prefs (
  user_id     text        primary key,
  name        text        not null default '',
  theme       text        not null default 'dark',
  updated_at  timestamptz not null default now()
);
alter table prefs enable row level security;
create policy "prefs_open" on prefs for all using (true) with check (true);

-- 4. INTENTIONS
create table if not exists intentions (
  id          text        primary key,
  user_id     text        not null,
  time        text,
  habit_id    text,
  habit_name  text,
  location    text,
  sentence    text,
  created_at  timestamptz not null default now()
);
alter table intentions enable row level security;
create policy "intentions_open" on intentions for all using (true) with check (true);
create index if not exists intentions_user_idx on intentions (user_id);

-- 5. NOTES
create table if not exists notes (
  id          uuid        primary key default gen_random_uuid(),
  user_id     text        not null,
  habit_id    text        not null,
  day_key     text        not null,  -- YYYY-MM-DD
  text        text        not null,
  created_at  timestamptz not null default now()
);
alter table notes enable row level security;
create policy "notes_open" on notes for all using (true) with check (true);
create index if not exists notes_user_idx on notes (user_id);
