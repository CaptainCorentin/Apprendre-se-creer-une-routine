-- Chaque nouveau profil démarre avec le même Hall of Fame de base
-- (Nadal / Zidane / Biles) que le profil par défaut.
create or replace function public.create_profile(p_name text, p_password text)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  new_id uuid;
  nadal_id uuid;
  zidane_id uuid;
  biles_id uuid;
begin
  insert into public.profiles (name, password_hash)
  values (p_name, crypt(p_password, gen_salt('bf')))
  returning id into new_id;

  insert into public.idols (profile_id, name, photo_url, display_order)
  values
    (new_id, 'Rafael Nadal', null, 1),
    (new_id, 'Zinédine Zidane', null, 2),
    (new_id, 'Simone Biles', null, 3)
  returning id into nadal_id;

  select id into nadal_id from public.idols where profile_id = new_id and name = 'Rafael Nadal';
  select id into zidane_id from public.idols where profile_id = new_id and name = 'Zinédine Zidane';
  select id into biles_id from public.idols where profile_id = new_id and name = 'Simone Biles';

  insert into public.idol_quotes (idol_id, quote_text, context_tag)
  values
    (nadal_id, 'Je ne renonce jamais. Je continue à me battre jusqu''à la fin.', 'streak_broken'),
    (nadal_id, 'La clé, c''est de rester concentré sur le moment présent.', 'random'),
    (nadal_id, 'Chaque jour est une nouvelle chance de s''améliorer.', 'milestone'),
    (zidane_id, 'Le talent, c''est le travail qu''on ne voit pas.', 'random'),
    (zidane_id, 'On tombe, on se relève, et on continue d''avancer.', 'streak_broken'),
    (zidane_id, 'Un jour de repos bien mérité fait partie de la victoire.', 'rest_day'),
    (biles_id, 'Je ne suis pas définie par mes échecs, mais par ma capacité à me relever.', 'streak_broken'),
    (biles_id, 'Écoute ton corps, se reposer c''est aussi progresser.', 'rest_day'),
    (biles_id, 'Chaque petit pas compte, même les moins visibles.', 'milestone');

  return new_id;
end;
$$;

grant execute on function public.create_profile(text, text) to anon, authenticated;
