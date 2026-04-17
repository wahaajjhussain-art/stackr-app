-- ─────────────────────────────────────────────────────────────
-- Stackr — Supabase schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ─────────────────────────────────────────────────────────────

-- ── Helper: auto-update updated_at on row modification ──
create or replace function update_timestamp() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

-- 1. HABITS
create table if not exists habits (
  id          text        primary key,
  user_id     text        not null,
  name        text        not null,
  time_slot   text        not null default 'Morning',
  category    text        not null default 'health',
  cue         text        not null default '',
  reward      text        not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
alter table habits enable row level security;
create policy "habits_open" on habits for all using (true) with check (true);
-- NOTE: Tighten RLS once Supabase Auth is integrated:
-- drop policy "habits_open" on habits;
-- create policy "habits_user_only" on habits for all
--   using (user_id = auth.jwt() ->> 'email')
--   with check (user_id = auth.jwt() ->> 'email');
create index if not exists habits_user_idx on habits (user_id);

-- Google Calendar sync columns
alter table habits add column if not exists gcal_event_id text;
alter table habits add column if not exists gcal_sync jsonb;

-- Auto-update trigger
drop trigger if exists habits_updated_at on habits;
create trigger habits_updated_at before update on habits
  for each row execute function update_timestamp();

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
create index if not exists completions_user_day_idx on completions (user_id, day_key);

-- 3. PREFS
create table if not exists prefs (
  user_id     text        primary key,
  name        text        not null default '',
  theme       text        not null default 'dark',
  updated_at  timestamptz not null default now()
);
alter table prefs enable row level security;
create policy "prefs_open" on prefs for all using (true) with check (true);

-- Auto-update trigger
drop trigger if exists prefs_updated_at on prefs;
create trigger prefs_updated_at before update on prefs
  for each row execute function update_timestamp();

-- 4. INTENTIONS
create table if not exists intentions (
  id          text        primary key,
  user_id     text        not null,
  time        text,
  habit_id    text,
  habit_name  text,
  location    text,
  sentence    text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
alter table intentions enable row level security;
create policy "intentions_open" on intentions for all using (true) with check (true);
create index if not exists intentions_user_idx on intentions (user_id);

-- Google Calendar sync columns for intentions
alter table intentions add column if not exists gcal_event_id text;
alter table intentions add column if not exists gcal_sync jsonb;

-- Auto-update trigger
drop trigger if exists intentions_updated_at on intentions;
create trigger intentions_updated_at before update on intentions
  for each row execute function update_timestamp();

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
create index if not exists notes_user_day_idx on notes (user_id, day_key);

-- 6. STACKS (was missing from original schema)
create table if not exists stacks (
  id          text        primary key,
  user_id     text        not null,
  habit_ids   jsonb       not null default '[]'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
alter table stacks enable row level security;
create policy "stacks_open" on stacks for all using (true) with check (true);
create index if not exists stacks_user_idx on stacks (user_id);
create index if not exists stacks_habit_ids_gin on stacks using gin (habit_ids);

-- Auto-update trigger
drop trigger if exists stacks_updated_at on stacks;
create trigger stacks_updated_at before update on stacks
  for each row execute function update_timestamp();

-- ─── FOREIGN KEY CONSTRAINTS ─────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'fk_completions_habit') then
    alter table completions add constraint fk_completions_habit
      foreign key (habit_id) references habits(id) on delete cascade;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'fk_notes_habit') then
    alter table notes add constraint fk_notes_habit
      foreign key (habit_id) references habits(id) on delete cascade;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'fk_intentions_habit') then
    alter table intentions add constraint fk_intentions_habit
      foreign key (habit_id) references habits(id) on delete set null;
  end if;
end $$;

-- ─── REMINDER COLUMNS ON PREFS ───────────────────────────────
alter table prefs add column if not exists reminders_enabled boolean not null default true;
alter table prefs add column if not exists reminder_hour smallint not null default 8;
alter table prefs add column if not exists timezone text;

-- 7. REMINDER LOG (prevents duplicate sends)
create table if not exists reminder_log (
  user_id     text  not null,
  day_key     text  not null,   -- YYYY-MM-DD
  sent_at     timestamptz not null default now(),
  primary key (user_id, day_key)
);
alter table reminder_log enable row level security;
create policy "reminder_log_open" on reminder_log for all using (true) with check (true);
create index if not exists reminder_log_user_idx on reminder_log (user_id);

-- ─── TRANSACTIONAL RESET FUNCTION ────────────────────────────
create or replace function reset_user_data(uid text) returns void as $$
begin
  delete from reminder_log where user_id = uid;
  delete from notes where user_id = uid;
  delete from completions where user_id = uid;
  delete from intentions where user_id = uid;
  delete from stacks where user_id = uid;
  delete from habits where user_id = uid;
  delete from prefs where user_id = uid;
end;
$$ language plpgsql security definer;

-- ─── ADMIN ANALYTICS VIEW ────────────────────────────────────
-- Usage: SELECT * FROM user_analytics ORDER BY last_active DESC;
-- Run in Supabase Dashboard → SQL Editor
create or replace view user_analytics as
select
  p.user_id                                          as email,
  p.name                                             as display_name,
  coalesce(h.habit_count, 0)                         as habits_added,
  coalesce(c.total_completions, 0)                   as total_completions,
  coalesce(c.days_active, 0)                         as days_active,
  coalesce(i.intention_count, 0)                     as intentions_created,
  coalesce(n.note_count, 0)                          as notes_written,
  coalesce(s.stack_count, 0)                         as stacks_created,
  h.first_habit_at                                   as first_habit_at,
  greatest(
    h.latest_habit_at,
    c.latest_completion,
    p.updated_at
  )                                                  as last_active
from prefs p
left join (
  select user_id,
         count(*)            as habit_count,
         min(created_at)     as first_habit_at,
         max(created_at)     as latest_habit_at
  from habits group by user_id
) h on h.user_id = p.user_id
left join (
  select user_id,
         count(*)                        as total_completions,
         count(distinct day_key)         as days_active,
         max(day_key)::date::timestamptz  as latest_completion
  from completions group by user_id
) c on c.user_id = p.user_id
left join (
  select user_id, count(*) as intention_count
  from intentions group by user_id
) i on i.user_id = p.user_id
left join (
  select user_id, count(*) as note_count
  from notes group by user_id
) n on n.user_id = p.user_id
left join (
  select user_id, count(*) as stack_count
  from stacks group by user_id
) s on s.user_id = p.user_id;
