-- Permet à chaque profil de refuser de recevoir des "piques" (garde les
-- encouragements). Appliqué à la fois côté app (composer) et en base
-- (trigger), en défense en profondeur.
alter table public.profiles add column if not exists accepts_piquant boolean not null default true;

drop function if exists public.list_profiles();

create or replace function public.list_profiles()
returns table (id uuid, name text, accepts_piquant boolean)
language sql
security definer
set search_path = public, extensions
as $$
  select id, name, accepts_piquant from public.profiles order by created_at asc;
$$;

create or replace function public.set_accepts_piquant(p_profile_id uuid, p_value boolean)
returns void
language sql
security definer
set search_path = public, extensions
as $$
  update public.profiles set accepts_piquant = p_value where id = p_profile_id;
$$;

grant execute on function public.list_profiles() to anon, authenticated;
grant execute on function public.set_accepts_piquant(uuid, boolean) to anon, authenticated;

create or replace function public.check_piquant_allowed()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if new.kind = 'piquant' and not (select accepts_piquant from public.profiles where id = new.to_profile_id) then
    raise exception 'Ce profil n''accepte pas les piques.';
  end if;
  return new;
end;
$$;

drop trigger if exists group_messages_check_piquant on public.group_messages;
create trigger group_messages_check_piquant
  before insert on public.group_messages
  for each row execute function public.check_piquant_allowed();
