-- Photo de profil par personne, affichée sur le pop-up du lundi, l'écran
-- "Entre nous" et le sélecteur de profil.
alter table public.profiles add column if not exists photo_url text;

drop function if exists public.list_profiles();

create or replace function public.list_profiles()
returns table (id uuid, name text, accepts_piquant boolean, shows_monday_recap boolean, photo_url text)
language sql
security definer
set search_path = public, extensions
as $$
  select id, name, accepts_piquant, shows_monday_recap, photo_url from public.profiles order by created_at asc;
$$;

create or replace function public.set_profile_photo(p_profile_id uuid, p_photo_url text)
returns void
language sql
security definer
set search_path = public, extensions
as $$
  update public.profiles set photo_url = p_photo_url where id = p_profile_id;
$$;

grant execute on function public.list_profiles() to anon, authenticated;
grant execute on function public.set_profile_photo(uuid, text) to anon, authenticated;

-- ============================================================
-- Storage bucket for profile photos
-- ============================================================
insert into storage.buckets (id, name, public)
values ('profile-photos', 'profile-photos', true)
on conflict (id) do nothing;

create policy "public read profile photos" on storage.objects
  for select using (bucket_id = 'profile-photos');

create policy "public write profile photos" on storage.objects
  for insert with check (bucket_id = 'profile-photos');

create policy "public update profile photos" on storage.objects
  for update using (bucket_id = 'profile-photos');

create policy "public delete profile photos" on storage.objects
  for delete using (bucket_id = 'profile-photos');
