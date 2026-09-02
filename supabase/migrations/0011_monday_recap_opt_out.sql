-- Chaque profil peut désactiver le pop-up "récap du lundi" (résumé hebdo des
-- autres profils, affiché une fois par lundi).
alter table public.profiles add column if not exists shows_monday_recap boolean not null default true;

drop function if exists public.list_profiles();

create or replace function public.list_profiles()
returns table (id uuid, name text, accepts_piquant boolean, shows_monday_recap boolean)
language sql
security definer
set search_path = public, extensions
as $$
  select id, name, accepts_piquant, shows_monday_recap from public.profiles order by created_at asc;
$$;

create or replace function public.set_shows_monday_recap(p_profile_id uuid, p_value boolean)
returns void
language sql
security definer
set search_path = public, extensions
as $$
  update public.profiles set shows_monday_recap = p_value where id = p_profile_id;
$$;

grant execute on function public.list_profiles() to anon, authenticated;
grant execute on function public.set_shows_monday_recap(uuid, boolean) to anon, authenticated;
