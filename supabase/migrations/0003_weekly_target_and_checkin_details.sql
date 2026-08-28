-- Domaines "flexibles" avec une cible hebdomadaire (ex: sport 3x/semaine)
-- au lieu d'un suivi quotidien strict. weekly_target = null -> comportement
-- quotidien inchangé.
alter table public.domains add column if not exists weekly_target integer;
alter table public.domains add constraint domains_weekly_target_check check (weekly_target is null or (weekly_target between 1 and 7));

-- Détails optionnels par checkin : temps passé + commentaire.
alter table public.checkins add column if not exists duration_minutes integer;
alter table public.checkins add constraint checkins_duration_minutes_check check (duration_minutes is null or duration_minutes >= 0);
alter table public.checkins add column if not exists comment text;
