-- Espace partagé "Entre nous" : chaque profil peut voir un résumé hebdo des
-- autres profils (pas le détail quotidien) et leur envoyer un message signé
-- (encouragement ou pique) en réaction à leur semaine.
create table if not exists public.group_messages (
  id uuid primary key default gen_random_uuid(),
  from_profile_id uuid not null references public.profiles(id) on delete cascade,
  to_profile_id uuid not null references public.profiles(id) on delete cascade,
  week_start_date date not null,
  kind text not null check (kind in ('encouragement', 'piquant')),
  message text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

alter table public.group_messages enable row level security;
create policy "allow all - group_messages" on public.group_messages for all using (true) with check (true);

create index if not exists group_messages_to_profile_idx on public.group_messages (to_profile_id, read_at);
create index if not exists group_messages_from_profile_idx on public.group_messages (from_profile_id);
