import { fetchMonthlyEntry, fetchWeeklyEntry } from "./data";
import {
  addDays,
  getEffectiveDate,
  getFirstSundayOfMonth,
  getMonthStart,
  getWeekStart,
  toDateKey,
} from "./date";

export interface JournalDueStatus {
  weekly: boolean;
  /** Semaine à combler (la dernière déjà terminée), même si on n'est plus dimanche. */
  weekKey: string;
  monthly: boolean;
  /** Mois à combler (le mois précédent), une fois le premier dimanche du mois passé. */
  monthKey: string | null;
}

/**
 * Contrairement au rappel forcé (qui n'apparaît que le jour J), ce statut reste
 * "dû" tant que l'entrée n'est pas remplie, même les jours suivants — pour que
 * l'app puisse continuer à signaler "tu n'as pas rempli" après coup.
 */
export async function checkJournalDue(profileId: string): Promise<JournalDueStatus> {
  const today = getEffectiveDate();

  // Semaine à revoir : celle qui vient de se terminer (dimanche <= aujourd'hui).
  const currentWeekStart = getWeekStart(today);
  const weekToReviewStart = today.getDay() === 0 ? currentWeekStart : addDays(currentWeekStart, -7);
  const weekKey = toDateKey(weekToReviewStart);
  const weeklyEntry = await fetchWeeklyEntry(profileId, weekKey);
  const weekly = !weeklyEntry;

  // Mois à revoir : le mois précédent, une fois qu'on a dépassé le premier
  // dimanche du mois en cours (avant ça, rien n'est encore "dû").
  const currentMonthStart = getMonthStart(today);
  const firstSunday = getFirstSundayOfMonth(currentMonthStart);
  let monthly = false;
  let monthKey: string | null = null;
  if (toDateKey(today) >= toDateKey(firstSunday)) {
    const previousMonthDate = addDays(currentMonthStart, -1);
    monthKey = toDateKey(getMonthStart(previousMonthDate));
    const entry = await fetchMonthlyEntry(profileId, monthKey);
    monthly = !entry;
  }

  return { weekly, weekKey, monthly, monthKey };
}
