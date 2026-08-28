"use client";

import { useMemo } from "react";
import type { Checkin, CheckinStatus, Domain } from "@/types/database";
import { StreakGauge } from "./StreakGauge";
import { WeeklyProgress } from "./WeeklyProgress";
import { CatchupRow, type CheckinEdit } from "./CatchupRow";
import { CheckinDetailsEditor } from "./CheckinDetailsEditor";
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

  function handleDetailsSave(details: { duration_minutes: number | null; comment: string | null }) {
    if (!todayCheckin) return;
    onCheckin(domain.id, todayKey, todayCheckin.status, {
      status: todayCheckin.status,
      ...details,
    });
  }

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

      <CheckinDetailsEditor checkin={todayCheckin} onSave={handleDetailsSave} />

      <CatchupRow
        checkinsByDate={checkinsByDate}
        color={domain.color}
        todayKey={todayKey}
        flexible={isFlexible}
        onEdit={(dateKey, edit) => onCheckin(domain.id, dateKey, edit.status, edit)}
      />
    </div>
  );
}
