"use client";

import { useMemo } from "react";
import type { Checkin, CheckinStatus, Domain } from "@/types/database";
import { StreakGauge } from "./StreakGauge";
import { CatchupRow } from "./CatchupRow";
import { calculateStreak } from "@/lib/streaks";
import { getEffectiveDateKey } from "@/lib/date";

const STATUS_OPTIONS: { status: CheckinStatus; label: string; icon: string }[] = [
  { status: "done", label: "Fait", icon: "✅" },
  { status: "missed", label: "Manqué", icon: "❌" },
  { status: "rest_assumed", label: "Repos assumé", icon: "🧊" },
];

interface Props {
  domain: Domain;
  checkins: Checkin[];
  onCheckin: (domainId: string, dateKey: string, status: CheckinStatus) => void;
}

export function DomainCard({ domain, checkins, onCheckin }: Props) {
  const todayKey = getEffectiveDateKey();
  const checkinsByDate = useMemo(() => {
    const map = new Map<string, Checkin>();
    for (const c of checkins) map.set(c.date, c);
    return map;
  }, [checkins]);

  const todayCheckin = checkinsByDate.get(todayKey);
  const streak = useMemo(() => calculateStreak(checkins), [checkins]);
  const frozen = todayCheckin?.status === "rest_assumed";

  return (
    <div className="carbon-panel rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{domain.icon}</span>
          <h3 className="font-semibold">{domain.name}</h3>
        </div>
      </div>

      <div className="mt-3">
        <StreakGauge streak={streak} color={domain.color} frozen={frozen} />
      </div>

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

      <CatchupRow
        checkinsByDate={checkinsByDate}
        color={domain.color}
        todayKey={todayKey}
        onEdit={(dateKey, status) => onCheckin(domain.id, dateKey, status)}
      />
    </div>
  );
}
