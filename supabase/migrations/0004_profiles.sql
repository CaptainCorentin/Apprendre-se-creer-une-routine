-- Système de profils multi-personnes : chaque profil (nom + mot de passe)
-- a ses propres domaines/checkins/journal/idoles, complètement séparés.
--
-- Le mot de passe est vérifié côté base via des fonctions SECURITY DEFINER
-- (pgcrypto), jamais exposé au client : la table `profiles` n'a aucune policy
-- RLS de lecture directe, seul le RPC ci-dessous peut y accéder.
--
-- Limite à connaître : la clé anon Supabase reste par ailleurs pleinement
-- permissive sur les autres tables (comme le reste de l'app). Ce mot de passe
-- empêche un partage de lien accidentel/casual, ce n'est pas une isolation
-- cryptographique robuste face à quelqu'un de déterminé et technique.

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
-- Aucune policy : la table n'est accessible qu'via les fonctions RPC ci-dessous.

create or replace function public.list_profiles()
returns table (id uuid, name text)
language sql
security definer
set search_path = public, extensions
as $$
  select id, name from public.profiles order by created_at asc;
$$;

create or replace function public.create_profile(p_name text, p_password text)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  new_id uuid;
begin
  insert into public.profiles (name, password_hash)
  values (p_name, crypt(p_password, gen_salt('bf')))
  returning id into new_id;
  return new_id;
end;
$$;

create or replace function public.verify_profile_password(p_profile_id uuid, p_password text)
returns boolean
language sql
security definer
set search_path = public, extensions
as $$
  select exists (
    select 1 from public.profiles
    where id = p_profile_id and password_hash = crypt(p_password, password_hash)
  );
$$;

create or replace function public.set_profile_password(p_profile_id uuid, p_old_password text, p_new_password text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if not public.verify_profile_password(p_profile_id, p_old_password) then
    return false;
  end if;
  update public.profiles set password_hash = crypt(p_new_password, gen_salt('bf')) where id = p_profile_id;
  return true;
end;
$$;

grant execute on function public.list_profiles() to anon, authenticated;
grant execute on function public.create_profile(text, text) to anon, authenticated;
grant execute on function public.verify_profile_password(uuid, text) to anon, authenticated;
grant execute on function public.set_profile_password(uuid, text, text) to anon, authenticated;

-- ============================================================
-- Rattache toutes les données existantes à un profil par défaut
-- ============================================================
do $$
declare
  default_profile_id uuid;
begin
  insert into public.profiles (name, password_hash)
  values ('Corentin', crypt('routine2026', gen_salt('bf')))
  returning id into default_profile_id;

  alter table public.domains add column if not exists profile_id uuid references public.profiles(id) on delete cascade;
  alter table public.checkins add column if not exists profile_id uuid references public.profiles(id) on delete cascade;
  alter table public.weekly_journal_entries add column if not exists profile_id uuid references public.profiles(id) on delete cascade;
  alter table public.monthly_journal_entries add column if not exists profile_id uuid references public.profiles(id) on delete cascade;
  alter table public.idols add column if not exists profile_id uuid references public.profiles(id) on delete cascade;

  update public.domains set profile_id = default_profile_id where profile_id is null;
  update public.checkins set profile_id = default_profile_id where profile_id is null;
  update public.weekly_journal_entries set profile_id = default_profile_id where profile_id is null;
  update public.monthly_journal_entries set profile_id = default_profile_id where profile_id is null;
  update public.idols set profile_id = default_profile_id where profile_id is null;

  alter table public.domains alter column profile_id set not null;
  alter table public.checkins alter column profile_id set not null;
  alter table public.weekly_journal_entries alter column profile_id set not null;
  alter table public.monthly_journal_entries alter column profile_id set not null;
  alter table public.idols alter column profile_id set not null;
end $$;

-- weekly/monthly journal entries et idol_quotes n'ont plus une date/nom
-- unique globalement mais par profil.
alter table public.weekly_journal_entries drop constraint if exists weekly_journal_entries_week_start_date_key;
alter table public.weekly_journal_entries add constraint weekly_journal_entries_profile_week_key unique (profile_id, week_start_date);

alter table public.monthly_journal_entries drop constraint if exists monthly_journal_entries_month_start_date_key;
alter table public.monthly_journal_entries add constraint monthly_journal_entries_profile_month_key unique (profile_id, month_start_date);

create index if not exists domains_profile_idx on public.domains (profile_id);
create index if not exists checkins_profile_idx on public.checkins (profile_id);
create index if not exists weekly_journal_entries_profile_idx on public.weekly_journal_entries (profile_id);
create index if not exists monthly_journal_entries_profile_idx on public.monthly_journal_entries (profile_id);
create index if not exists idols_profile_idx on public.idols (profile_id);
