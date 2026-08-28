import { DAY_CUTOFF_HOUR } from "./constants";

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

export function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Le "jour effectif" ne se termine pas à minuit mais à 3h du matin :
 * toute action entre 00h00 et 03h00 est rattachée au jour calendaire précédent.
 */
export function getEffectiveDate(now: Date = new Date()): Date {
  const effective = new Date(now);
  if (now.getHours() < DAY_CUTOFF_HOUR) {
    effective.setDate(effective.getDate() - 1);
  }
  return effective;
}

export function getEffectiveDateKey(now: Date = new Date()): string {
  return toDateKey(getEffectiveDate(now));
}

export function addDays(d: Date, days: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function isSameDay(a: Date, b: Date): boolean {
  return toDateKey(a) === toDateKey(b);
}

/** Lundi comme premier jour de la semaine. */
export function getWeekStart(d: Date): Date {
  const copy = new Date(d);
  const day = copy.getDay(); // 0 = dimanche
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function getMonthStart(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function isFirstSundayOfMonth(d: Date): boolean {
  if (d.getDay() !== 0) return false;
  return d.getDate() <= 7;
}

export function getFirstSundayOfMonth(monthStart: Date): Date {
  const d = new Date(monthStart);
  while (d.getDay() !== 0) d.setDate(d.getDate() + 1);
  return d;
}

export function formatDateFr(key: string): string {
  const d = fromDateKey(key);
  return d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
}

export function formatMonthFr(d: Date): string {
  return d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

export function formatWeekRangeFr(weekStartKey: string): string {
  const start = fromDateKey(weekStartKey);
  const end = addDays(start, 6);
  return `${start.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} – ${end.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}`;
}

/** Les débuts de semaine (lundi) qui recouvrent au moins un jour du mois donné. */
export function getWeeksOverlappingMonth(monthStartKey: string): string[] {
  const monthStart = fromDateKey(monthStartKey);
  const nextMonthStart = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1);
  const weeks: string[] = [];
  let cursor = getWeekStart(monthStart);
  while (cursor < nextMonthStart) {
    weeks.push(toDateKey(cursor));
    cursor = addDays(cursor, 7);
  }
  return weeks;
}

/** Liste des N derniers jours effectifs (le plus récent en premier). */
export function lastNDays(n: number, now: Date = new Date()): string[] {
  const today = getEffectiveDate(now);
  const days: string[] = [];
  for (let i = 0; i < n; i++) {
    days.push(toDateKey(addDays(today, -i)));
  }
  return days;
}
