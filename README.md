# Routine & Growth Mindset

Application personnelle de suivi de routine et de growth mindset. Aucune authentification :
il s'agit d'un usage strictement personnel, à un seul utilisateur.

## Stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript + Tailwind CSS
- [Supabase](https://supabase.com) (Postgres + Storage) via `@supabase/supabase-js`
- Déploiement sur [Vercel](https://vercel.com)

## Démarrage local

```bash
npm install
cp .env.example .env.local # renseigner les clés Supabase
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

## Variables d'environnement

Voir `.env.example` :

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Les mêmes variables doivent être configurées dans le projet Vercel.

## Base de données

Les migrations SQL sont dans `supabase/migrations/`. Elles créent le schéma
(`domains`, `checkins`, `weekly_journal_entries`, `monthly_journal_entries`, `idols`,
`idol_quotes`), les policies RLS et le bucket de stockage `idol-photos`, puis
seedent le Hall of Fame initial (Nadal, Zidane, Biles).

## Logique métier

- **Jour effectif** : un jour se termine à 3h du matin (pas minuit). Voir `src/lib/date.ts`.
- **Auto-marquage "Manqué"** : au chargement de l'app, les jours effectifs passés sans
  checkin pour un domaine actif sont insérés rétroactivement en `missed` (`src/lib/data.ts`,
  `backfillMissedCheckins`). Pas de cron serveur.
- **Streak** : `done` +1, `missed` remet à zéro, `rest_assumed` gèle le streak
  (`src/lib/streaks.ts`).
- **Rappels forcés** : modal hebdomadaire le dimanche, modal mensuel le premier
  dimanche du mois (`src/components/ForcedJournalModals.tsx`).
