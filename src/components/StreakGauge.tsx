"use client";

import { STREAK_MILESTONES } from "@/lib/constants";

interface Props {
  streak: number;
  color: string;
  frozen?: boolean;
}

function nextMilestone(streak: number): number {
  return STREAK_MILESTONES.find((m) => m > streak) ?? STREAK_MILESTONES[STREAK_MILESTONES.length - 1] * 2;
}

export function StreakGauge({ streak, color, frozen }: Props) {
  const target = nextMilestone(streak);
  const prevTarget = STREAK_MILESTONES.filter((m) => m <= streak).pop() ?? 0;
  const progress = target === prevTarget ? 1 : (streak - prevTarget) / (target - prevTarget);
  const scale = Math.min(1 + streak / 40, 1.9);
  const fontSize = Math.min(28 + streak * 1.5, 56);

  return (
    <div className="flex items-center gap-3">
      <div
        className="flame-icon shrink-0"
        style={{
          fontSize,
          transform: `scale(${scale})`,
          filter: frozen ? "grayscale(0.6) brightness(0.85)" : "none",
          animationPlayState: frozen ? "paused" : "running",
        }}
      >
        {frozen ? "🧊" : "🔥"}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-2xl font-bold leading-none" style={{ color }}>
          {streak}
          <span className="ml-1 text-xs font-normal text-foreground-muted">
            {streak <= 1 ? "jour" : "jours"}
          </span>
        </p>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-raised">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(progress, 1) * 100}%`, backgroundColor: color }}
          />
        </div>
        <p className="mt-1 text-[11px] text-foreground-muted">
          Prochain palier : {target} jours
        </p>
      </div>
    </div>
  );
}
