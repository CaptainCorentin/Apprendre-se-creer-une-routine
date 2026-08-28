import type { Checkin } from "@/types/database";
import { STREAK_MILESTONES, WEEKLY_STREAK_MILESTONES } from "./constants";
import { addDays, fromDateKey, getEffectiveDate, getWeekStart, toDateKey } from "./date";

/**
 * Calcule le streak courant d'un domaine à partir de ses checkins.
 * Règles :
 *  - "done" -> +1
 *  - "missed" -> le streak s'arrête (remis à 0)
 *  - "rest_assumed" -> gelé, ne compte pas mais n'interrompt pas le streak
 *
 * `checkins` doit contenir l'historique du domaine (peu importe l'ordre).
 */
export function calculateStreak(checkins: Checkin[]): number {
  const sorted = [...checkins].sort((a, b) => (a.date < b.date ? 1 : -1));

  let streak = 0;
  for (const checkin of sorted) {
    if (checkin.status === "done") {
      streak += 1;
    } else if (checkin.status === "rest_assumed") {
      continue;
    } else {
      break;
    }
  }
  return streak;
}

/** Renvoie le palier de streak atteint si `streak` correspond exactement à un seuil, sinon null. */
export function getMilestoneReached(streak: number): number | null {
  return STREAK_MILESTONES.includes(streak) ? streak : null;
}

export interface WeeklyStreakResult {
  /** Semaines consécutives où la cible a été atteinte (semaine en cours incluse si déjà atteinte). */
  streak: number;
  /** Nombre de "done" comptabilisés pour la semaine en cours. */
  currentWeekCount: number;
}

/**
 * Calcule le streak "en semaines" d'un domaine à cible hebdomadaire :
 * une semaine compte si le nombre de checkins "done" atteint `weeklyTarget`.
 */
export function calculateWeeklyStreak(
  checkins: Checkin[],
  weeklyTarget: number,
  now: Date = new Date()
): WeeklyStreakResult {
  const doneByWeek = new Map<string, number>();
  for (const c of checkins) {
    if (c.status !== "done") continue;
    const weekKey = toDateKey(getWeekStart(fromDateKey(c.date)));
    doneByWeek.set(weekKey, (doneByWeek.get(weekKey) ?? 0) + 1);
  }

  const currentWeekStart = getWeekStart(getEffectiveDate(now));
  const currentWeekCount = doneByWeek.get(toDateKey(currentWeekStart)) ?? 0;

  let streak = 0;
  let cursor = addDays(currentWeekStart, -7);
  while (true) {
    const count = doneByWeek.get(toDateKey(cursor));
    if (count !== undefined && count >= weeklyTarget) {
      streak += 1;
      cursor = addDays(cursor, -7);
    } else {
      break;
    }
  }
  if (currentWeekCount >= weeklyTarget) streak += 1;

  return { streak, currentWeekCount };
}

export function getWeeklyMilestoneReached(streak: number): number | null {
  return WEEKLY_STREAK_MILESTONES.includes(streak) ? streak : null;
}
