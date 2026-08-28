"use client";

import { useEffect, useMemo, useState } from "react";
import { useAppContext } from "./AppProvider";
import { fetchCheckinsInRange } from "@/lib/data";
import type { Checkin } from "@/types/database";
import { addDays, formatWeekRangeFr, fromDateKey, getWeeksOverlappingMonth, toDateKey } from "@/lib/date";

interface Props {
  monthStartKey: string;
}

export function MonthlyCheckinRecap({ monthStartKey }: Props) {
  const { activeDomains } = useAppContext();
  const [checkins, setCheckins] = useState<Checkin[]>([]);

  const weekStarts = useMemo(() => getWeeksOverlappingMonth(monthStartKey), [monthStartKey]);

  useEffect(() => {
    if (activeDomains.length === 0 || weekStarts.length === 0) return;
    const domainIds = activeDomains.map((d) => d.id);
    const rangeEnd = toDateKey(addDays(fromDateKey(weekStarts[weekStarts.length - 1]), 6));
    fetchCheckinsInRange(domainIds, weekStarts[0], rangeEnd).then(setCheckins);
  }, [activeDomains, weekStarts]);

  if (activeDomains.length === 0) return null;

  const doneCountByWeekDomain = new Map<string, number>();
  const minutesByWeekDomain = new Map<string, number>();
  for (const c of checkins) {
    if (c.status !== "done") continue;
    const weekKey = toDateKey(getWeekStartFor(c.date, weekStarts));
    const key = `${weekKey}__${c.domain_id}`;
    doneCountByWeekDomain.set(key, (doneCountByWeekDomain.get(key) ?? 0) + 1);
    if (c.duration_minutes) minutesByWeekDomain.set(key, (minutesByWeekDomain.get(key) ?? 0) + c.duration_minutes);
  }

  return (
    <div className="rounded-xl border border-border-subtle bg-surface-raised p-3">
      <p className="mb-2 text-xs font-semibold text-foreground-muted">Récap par semaine</p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[320px] border-collapse text-xs">
          <thead>
            <tr>
              <th className="p-1 text-left font-normal text-foreground-muted">Semaine</th>
              {activeDomains.map((d) => (
                <th key={d.id} className="p-1 text-center font-normal" title={d.name}>
                  {d.icon}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weekStarts.map((weekKey) => (
              <tr key={weekKey} className="border-t border-border-subtle">
                <td className="whitespace-nowrap p-1 text-foreground-muted">{formatWeekRangeFr(weekKey)}</td>
                {activeDomains.map((d) => {
                  const key = `${weekKey}__${d.id}`;
                  const done = doneCountByWeekDomain.get(key) ?? 0;
                  const minutes = minutesByWeekDomain.get(key) ?? 0;
                  const target = d.weekly_target ?? 7;
                  return (
                    <td key={d.id} className="p-1 text-center">
                      <span className={done >= target ? "text-accent-strong font-medium" : "text-foreground-muted"}>
                        {done}/{target}
                      </span>
                      {minutes > 0 && <span className="ml-1 text-[9px] text-foreground-muted">{minutes}m</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function getWeekStartFor(dateKey: string, weekStarts: string[]): Date {
  const d = fromDateKey(dateKey);
  for (let i = weekStarts.length - 1; i >= 0; i--) {
    const start = fromDateKey(weekStarts[i]);
    if (d >= start) return start;
  }
  return fromDateKey(weekStarts[0]);
}
