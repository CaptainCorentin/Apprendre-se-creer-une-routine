-- Objectifs chiffrés par domaine (ex: "2L d'eau", "20 pages") en plus du
-- Fait/Manqué/Repos assumé existant.
alter table public.domains add column if not exists target_value numeric;
alter table public.domains add column if not exists target_unit text;
alter table public.domains add constraint domains_target_value_check check (target_value is null or target_value > 0);

alter table public.checkins add column if not exists value_achieved numeric;
alter table public.checkins add constraint checkins_value_achieved_check check (value_achieved is null or value_achieved >= 0);
