-- Routine / growth mindset tracking app - initial schema
-- Single-user personal app: no auth, RLS is enabled but fully permissive
-- (the app is only ever called with the anon/publishable key from a private deployment).

create extension if not exists "pgcrypto";

-- ============================================================
-- domains
-- ============================================================
create table if not exists public.domains (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  icon text not null default '🔥',
  color text not null default '#e11d2f',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============================================================
-- checkins
-- ============================================================
create table if not exists public.checkins (
  id uuid primary key default gen_random_uuid(),
  domain_id uuid not null references public.domains(id) on delete cascade,
  date date not null,
  status text not null check (status in ('done', 'missed', 'rest_assumed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (domain_id, date)
);

create index if not exists checkins_domain_date_idx on public.checkins (domain_id, date desc);

-- ============================================================
-- weekly_journal_entries
-- ============================================================
create table if not exists public.weekly_journal_entries (
  id uuid primary key default gen_random_uuid(),
  week_start_date date not null unique,
  went_well text not null default '',
  got_stuck text not null default '',
  pushed_through text not null default '',
  process_learning text not null default '',
  created_at timestamptz not null default now()
);

-- ============================================================
-- monthly_journal_entries
-- ============================================================
create table if not exists public.monthly_journal_entries (
  id uuid primary key default gen_random_uuid(),
  month_start_date date not null unique,
  domain_trends text not null default '',
  biggest_learning text not null default '',
  next_month_intention text not null default '',
  created_at timestamptz not null default now()
);

-- ============================================================
-- idols
-- ============================================================
create table if not exists public.idols (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  photo_url text,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- ============================================================
-- idol_quotes
-- ============================================================
create table if not exists public.idol_quotes (
  id uuid primary key default gen_random_uuid(),
  idol_id uuid not null references public.idols(id) on delete cascade,
  quote_text text not null,
  context_tag text check (context_tag in ('streak_broken', 'milestone', 'rest_day', 'random') or context_tag is null),
  created_at timestamptz not null default now()
);

create index if not exists idol_quotes_idol_idx on public.idol_quotes (idol_id);
create index if not exists idol_quotes_tag_idx on public.idol_quotes (context_tag);

-- ============================================================
-- RLS: enabled but fully permissive (personal single-user app, no auth)
-- ============================================================
alter table public.domains enable row level security;
alter table public.checkins enable row level security;
alter table public.weekly_journal_entries enable row level security;
alter table public.monthly_journal_entries enable row level security;
alter table public.idols enable row level security;
alter table public.idol_quotes enable row level security;

create policy "allow all - domains" on public.domains for all using (true) with check (true);
create policy "allow all - checkins" on public.checkins for all using (true) with check (true);
create policy "allow all - weekly_journal_entries" on public.weekly_journal_entries for all using (true) with check (true);
create policy "allow all - monthly_journal_entries" on public.monthly_journal_entries for all using (true) with check (true);
create policy "allow all - idols" on public.idols for all using (true) with check (true);
create policy "allow all - idol_quotes" on public.idol_quotes for all using (true) with check (true);

-- ============================================================
-- Storage bucket for idol photos
-- ============================================================
insert into storage.buckets (id, name, public)
values ('idol-photos', 'idol-photos', true)
on conflict (id) do nothing;

create policy "public read idol photos" on storage.objects
  for select using (bucket_id = 'idol-photos');

create policy "public write idol photos" on storage.objects
  for insert with check (bucket_id = 'idol-photos');

create policy "public update idol photos" on storage.objects
  for update using (bucket_id = 'idol-photos');

create policy "public delete idol photos" on storage.objects
  for delete using (bucket_id = 'idol-photos');
