import type { Checkin } from "@/types/database";
import { STREAK_MILESTONES } from "./constants";

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
