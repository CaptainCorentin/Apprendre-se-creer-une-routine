-- Le Hall of Fame (idoles + citations) devient partagé entre tous les
-- profils : une photo ajoutée par un profil s'applique à tous, et une idole
-- ajoutée par n'importe quel profil est visible de tous.

-- 1) Déduplique : chaque profil avait sa propre copie des 3 idoles de départ
--    (créées automatiquement à la création du profil). On garde une seule
--    ligne par nom d'idole, en priorité celle qui a déjà une photo.
do $$
declare
  nm text;
  keep_id uuid;
begin
  for nm in select distinct name from public.idols
  loop
    select id into keep_id
    from public.idols
    where name = nm
    order by (photo_url is null), created_at asc
    limit 1;

    delete from public.idols where name = nm and id <> keep_id;
  end loop;
end $$;

-- 2) L'idole n'appartient plus à un profil : supprime la colonne.
drop index if exists public.idols_profile_idx;
alter table public.idols drop column if exists profile_id;

-- 3) La création d'un profil n'a plus à seeder ses propres idoles : le Hall
--    of Fame global n'est amorcé qu'une seule fois, s'il est encore vide.
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

  if not exists (select 1 from public.idols) then
    insert into public.idols (name, photo_url, display_order)
    values
      ('Rafael Nadal', null, 1),
      ('Zinédine Zidane', null, 2),
      ('Simone Biles', null, 3);

    select id into nadal_id from public.idols where name = 'Rafael Nadal';
    select id into zidane_id from public.idols where name = 'Zinédine Zidane';
    select id into biles_id from public.idols where name = 'Simone Biles';

    insert into public.idol_quotes (idol_id, quote_text, context_tag) values
      (nadal_id, 'Endure, accepte les choses comme elles sont et non comme tu voudrais qu''elles soient. Puis regarde devant toi, jamais derrière.', 'streak_broken'),
      (nadal_id, 'J''ai appris, tout au long de ma carrière, à aimer la souffrance.', 'milestone'),
      (nadal_id, 'On ne peut pas surmonter le doute, on vit avec. Ce qu''on peut faire, c''est donner le meilleur de soi chaque jour.', 'random'),
      (nadal_id, 'On travaille mentalement chaque jour sur le court : on ne se plaint pas quand on joue mal ou qu''on a mal, on garde la bonne attitude.', 'random'),
      (zidane_id, 'Mon père nous a appris qu''un immigré doit travailler deux fois plus que n''importe qui d''autre, et qu''il ne doit jamais abandonner.', 'streak_broken'),
      (zidane_id, 'Peu importe combien de fois tu gagnes un trophée, c''est toujours quelque chose de spécial.', 'milestone'),
      (zidane_id, 'Les performances individuelles, ce n''est pas le plus important. On gagne et on perd en équipe.', 'random'),
      (zidane_id, 'La vie est pleine de regrets, mais ça ne sert à rien de regarder en arrière.', 'random'),
      (biles_id, 'Aucune médaille, aucune récompense n''est plus importante que ta santé mentale.', 'rest_day'),
      (biles_id, 'Mets ta santé mentale en premier : sinon, tu ne prendras plus de plaisir dans ton sport et tu ne réussiras pas autant que tu le voudrais.', 'rest_day'),
      (biles_id, 'Je dois mettre ma fierté de côté et faire ce qui est juste pour moi, pour ma santé et mon bien-être.', 'streak_broken'),
      (biles_id, 'On est tous des champions à sa manière, selon la façon dont on gère ses échecs et ses réussites.', 'random');
  end if;

  return new_id;
end;
$$;

grant execute on function public.create_profile(text, text) to anon, authenticated;
