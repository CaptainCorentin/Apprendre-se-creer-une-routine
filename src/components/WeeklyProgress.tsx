"use client";

interface Props {
  currentWeekCount: number;
  weeklyTarget: number;
  weeksStreak: number;
  color: string;
}

export function WeeklyProgress({ currentWeekCount, weeklyTarget, weeksStreak, color }: Props) {
  const reached = currentWeekCount >= weeklyTarget;
  const progress = Math.min(currentWeekCount / weeklyTarget, 1);

  return (
    <div className="flex items-center gap-3">
      <div className="text-3xl shrink-0" style={{ opacity: reached ? 1 : 0.6 }}>
        {reached ? "🏅" : "🎯"}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-2xl font-bold leading-none" style={{ color }}>
          {currentWeekCount}
          <span className="text-sm font-normal text-foreground-muted"> / {weeklyTarget} cette semaine</span>
        </p>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-raised">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress * 100}%`, backgroundColor: color }}
          />
        </div>
        <p className="mt-1 text-[11px] text-foreground-muted">
          {weeksStreak > 0
            ? `${weeksStreak} ${weeksStreak > 1 ? "semaines" : "semaine"} d'affilée à l'objectif`
            : "Objectif hebdomadaire"}
        </p>
      </div>
    </div>
  );
}
