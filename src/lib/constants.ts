// Heure de coupure du "jour effectif" : un jour se termine à 3h du matin, pas à minuit.
export const DAY_CUTOFF_HOUR = 3;

// Seuils de streak (en jours) qui déclenchent un pop-up "milestone" pour les domaines quotidiens.
export const STREAK_MILESTONES = [7, 14, 30, 60, 100];

// Seuils de streak (en semaines) pour les domaines à cible hebdomadaire.
export const WEEKLY_STREAK_MILESTONES = [4, 8, 12, 26, 52];

// Jour de la semaine (0 = dimanche) où le rappel du journal hebdomadaire est forcé.
export const WEEKLY_REMINDER_WEEKDAY = 0;

// Nombre de jours affichés dans le panneau de rattrapage.
export const CATCHUP_DAYS = 14;

export const DOMAIN_ICONS = ["🔥", "💪", "📚", "🧘", "🏃", "🎯", "🎨", "💼", "🧠", "🌱"];

export const DOMAIN_COLORS = [
  "#e11d2f",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#6366f1",
  "#d946ef",
  "#f43f5e",
];
