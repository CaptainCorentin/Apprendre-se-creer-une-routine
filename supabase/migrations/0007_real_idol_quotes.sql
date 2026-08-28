-- Remplace les citations fictives du Hall of Fame par de vraies citations
-- sourcées (traduites en français), et met à jour la fonction de création de
-- profil pour que les futurs profils héritent directement des bonnes.

-- 1) Met à jour les citations pour tous les profils déjà existants.
do $$
declare
  idol record;
begin
  for idol in select id, profile_id, name from public.idols where name in ('Rafael Nadal', 'Zinédine Zidane', 'Simone Biles')
  loop
    delete from public.idol_quotes where idol_id = idol.id;

    if idol.name = 'Rafael Nadal' then
      insert into public.idol_quotes (idol_id, quote_text, context_tag) values
        (idol.id, 'Endure, accepte les choses comme elles sont et non comme tu voudrais qu''elles soient. Puis regarde devant toi, jamais derrière.', 'streak_broken'),
        (idol.id, 'J''ai appris, tout au long de ma carrière, à aimer la souffrance.', 'milestone'),
        (idol.id, 'On ne peut pas surmonter le doute, on vit avec. Ce qu''on peut faire, c''est donner le meilleur de soi chaque jour.', 'random'),
        (idol.id, 'On travaille mentalement chaque jour sur le court : on ne se plaint pas quand on joue mal ou qu''on a mal, on garde la bonne attitude.', 'random');
    elsif idol.name = 'Zinédine Zidane' then
      insert into public.idol_quotes (idol_id, quote_text, context_tag) values
        (idol.id, 'Mon père nous a appris qu''un immigré doit travailler deux fois plus que n''importe qui d''autre, et qu''il ne doit jamais abandonner.', 'streak_broken'),
        (idol.id, 'Peu importe combien de fois tu gagnes un trophée, c''est toujours quelque chose de spécial.', 'milestone'),
        (idol.id, 'Les performances individuelles, ce n''est pas le plus important. On gagne et on perd en équipe.', 'random'),
        (idol.id, 'La vie est pleine de regrets, mais ça ne sert à rien de regarder en arrière.', 'random');
    elsif idol.name = 'Simone Biles' then
      insert into public.idol_quotes (idol_id, quote_text, context_tag) values
        (idol.id, 'Aucune médaille, aucune récompense n''est plus importante que ta santé mentale.', 'rest_day'),
        (idol.id, 'Mets ta santé mentale en premier : sinon, tu ne prendras plus de plaisir dans ton sport et tu ne réussiras pas autant que tu le voudrais.', 'rest_day'),
        (idol.id, 'Je dois mettre ma fierté de côté et faire ce qui est juste pour moi, pour ma santé et mon bien-être.', 'streak_broken'),
        (idol.id, 'On est tous des champions à sa manière, selon la façon dont on gère ses échecs et ses réussites.', 'random');
    end if;
  end loop;
end $$;

-- 2) Met à jour la fonction de création de profil pour les futurs profils.
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
    (new_id, 'Simone Biles', null, 3);

  select id into nadal_id from public.idols where profile_id = new_id and name = 'Rafael Nadal';
  select id into zidane_id from public.idols where profile_id = new_id and name = 'Zinédine Zidane';
  select id into biles_id from public.idols where profile_id = new_id and name = 'Simone Biles';

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

  return new_id;
end;
$$;

grant execute on function public.create_profile(text, text) to anon, authenticated;
