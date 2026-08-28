"use client";

import { useMemo, useState } from "react";
import type { Checkin, CheckinStatus, Domain } from "@/types/database";
import { StreakGauge } from "./StreakGauge";
import { WeeklyProgress } from "./WeeklyProgress";
import { CatchupRow, type CheckinEdit } from "./CatchupRow";
import { CheckinDetailsEditor } from "./CheckinDetailsEditor";
import { YearHeatmap } from "./YearHeatmap";
import { calculateStreak, calculateWeeklyStreak } from "@/lib/streaks";
import { getEffectiveDateKey } from "@/lib/date";

const STATUS_OPTIONS: { status: CheckinStatus; label: string; icon: string }[] = [
  { status: "done", label: "Fait", icon: "✅" },
  { status: "missed", label: "Manqué", icon: "❌" },
  { status: "rest_assumed", label: "Repos assumé", icon: "🧊" },
];

interface Props {
  domain: Domain;
  checkins: Checkin[];
  onCheckin: (domainId: string, dateKey: string, status: CheckinStatus | "none", details?: CheckinEdit) => void;
}

export function DomainCard({ domain, checkins, onCheckin }: Props) {
  const [showHeatmap, setShowHeatmap] = useState(false);
  const todayKey = getEffectiveDateKey();
  const checkinsByDate = useMemo(() => {
    const map = new Map<string, Checkin>();
    for (const c of checkins) map.set(c.date, c);
    return map;
  }, [checkins]);

  const todayCheckin = checkinsByDate.get(todayKey);
  const isFlexible = !!domain.weekly_target;

  const dailyStreak = useMemo(
    () => (isFlexible ? 0 : calculateStreak(checkins)),
    [checkins, isFlexible]
  );
  const weeklyResult = useMemo(
    () => (isFlexible ? calculateWeeklyStreak(checkins, domain.weekly_target!) : null),
    [checkins, isFlexible, domain.weekly_target]
  );
  const frozen = todayCheckin?.status === "rest_assumed";

  function handleDetailsSave(details: {
    duration_minutes: number | null;
    comment: string | null;
    value_achieved: number | null;
  }) {
    if (!todayCheckin) return;
    onCheckin(domain.id, todayKey, todayCheckin.status, {
      status: todayCheckin.status,
      ...details,
    });
  }

  const targetProgress =
    domain.target_value != null
      ? Math.min((todayCheckin?.value_achieved ?? 0) / domain.target_value, 1)
      : null;

  return (
    <div className="carbon-panel rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{domain.icon}</span>
          <h3 className="font-semibold">{domain.name}</h3>
        </div>
        {isFlexible && (
          <span className="rounded-full bg-surface-raised px-2 py-0.5 text-[10px] text-foreground-muted">
            {domain.weekly_target}x / semaine
          </span>
        )}
      </div>

      <div className="mt-3">
        {isFlexible && weeklyResult ? (
          <WeeklyProgress
            currentWeekCount={weeklyResult.currentWeekCount}
            weeklyTarget={domain.weekly_target!}
            weeksStreak={weeklyResult.streak}
            color={domain.color}
          />
        ) : (
          <StreakGauge streak={dailyStreak} color={domain.color} frozen={frozen} />
        )}
      </div>

      {targetProgress != null && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-[11px] text-foreground-muted">
            <span>Objectif du jour</span>
            <span>
              {todayCheckin?.value_achieved ?? 0} / {domain.target_value} {domain.target_unit}
            </span>
          </div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surface-raised">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${targetProgress * 100}%`, backgroundColor: domain.color }}
            />
          </div>
        </div>
      )}

      {isFlexible ? (
        <button
          onClick={() =>
            onCheckin(domain.id, todayKey, todayCheckin ? "none" : "done")
          }
          className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium transition ${
            todayCheckin
              ? "border-accent bg-accent/15 text-accent-strong"
              : "border-border-subtle text-foreground-muted hover:border-accent/50"
          }`}
        >
          <span className="text-lg">✅</span>
          {todayCheckin ? "Fait aujourd'hui" : "J'ai fait ça aujourd'hui"}
        </button>
      ) : (
        <div className="mt-4 grid grid-cols-3 gap-2">
          {STATUS_OPTIONS.map((opt) => {
            const active = todayCheckin?.status === opt.status;
            return (
              <button
                key={opt.status}
                onClick={() => onCheckin(domain.id, todayKey, opt.status)}
                className={`flex flex-col items-center gap-1 rounded-xl border py-2.5 text-xs font-medium transition ${
                  active
                    ? "border-accent bg-accent/15 text-accent-strong"
                    : "border-border-subtle text-foreground-muted hover:border-accent/50"
                }`}
              >
                <span className="text-lg">{opt.icon}</span>
                {opt.label}
              </button>
            );
          })}
        </div>
      )}

      <CheckinDetailsEditor checkin={todayCheckin} targetUnit={domain.target_unit} onSave={handleDetailsSave} />

      <CatchupRow
        checkinsByDate={checkinsByDate}
        color={domain.color}
        todayKey={todayKey}
        flexible={isFlexible}
        targetUnit={domain.target_unit}
        onEdit={(dateKey, edit) => onCheckin(domain.id, dateKey, edit.status, edit)}
      />

      <div className="mt-3">
        <button
          onClick={() => setShowHeatmap((v) => !v)}
          className="text-xs font-medium text-foreground-muted underline decoration-dotted underline-offset-2 hover:text-accent-strong"
        >
          {showHeatmap ? "Masquer" : "Voir l'historique complet"}
        </button>
        {showHeatmap && (
          <div className="mt-3">
            <YearHeatmap domainId={domain.id} color={domain.color} />
          </div>
        )}
      </div>
    </div>
  );
}
