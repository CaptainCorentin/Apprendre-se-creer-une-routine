-- Seed initial "Hall of Fame" idols with a few quotes each.
-- photo_url left null: the UI falls back to a generic silhouette placeholder.

insert into public.idols (name, photo_url, display_order)
values
  ('Rafael Nadal', null, 1),
  ('Zinédine Zidane', null, 2),
  ('Simone Biles', null, 3)
on conflict do nothing;

insert into public.idol_quotes (idol_id, quote_text, context_tag)
select id, quote_text, context_tag::text
from public.idols
join (
  values
    ('Rafael Nadal', 'Je ne renonce jamais. Je continue à me battre jusqu''à la fin.', 'streak_broken'),
    ('Rafael Nadal', 'La clé, c''est de rester concentré sur le moment présent.', 'random'),
    ('Rafael Nadal', 'Chaque jour est une nouvelle chance de s''améliorer.', 'milestone'),
    ('Zinédine Zidane', 'Le talent, c''est le travail qu''on ne voit pas.', 'random'),
    ('Zinédine Zidane', 'On tombe, on se relève, et on continue d''avancer.', 'streak_broken'),
    ('Zinédine Zidane', 'Un jour de repos bien mérité fait partie de la victoire.', 'rest_day'),
    ('Simone Biles', 'Je ne suis pas définie par mes échecs, mais par ma capacité à me relever.', 'streak_broken'),
    ('Simone Biles', 'Écoute ton corps, se reposer c''est aussi progresser.', 'rest_day'),
    ('Simone Biles', 'Chaque petit pas compte, même les moins visibles.', 'milestone')
) as q(idol_name, quote_text, context_tag) on q.idol_name = idols.name
on conflict do nothing;
