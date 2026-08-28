"use client";

import { useEffect, useMemo, useState } from "react";
import { useAppContext } from "./AppProvider";
import { fetchCheckinsInRange } from "@/lib/data";
import type { Checkin, CheckinStatus } from "@/types/database";
import { addDays, formatDateFr, fromDateKey, toDateKey } from "@/lib/date";

const STATUS_ICON: Record<CheckinStatus, string> = {
  done: "✅",
  missed: "❌",
  rest_assumed: "🧊",
};

interface Props {
  weekStartKey: string;
}

export function WeeklyCheckinRecap({ weekStartKey }: Props) {
  const { activeDomains } = useAppContext();
  const [checkins, setCheckins] = useState<Checkin[]>([]);

  const days = useMemo(() => {
    const start = fromDateKey(weekStartKey);
    return Array.from({ length: 7 }, (_, i) => toDateKey(addDays(start, i)));
  }, [weekStartKey]);

  useEffect(() => {
    if (activeDomains.length === 0) return;
    const domainIds = activeDomains.map((d) => d.id);
    fetchCheckinsInRange(domainIds, days[0], days[6]).then(setCheckins);
  }, [activeDomains, days]);

  if (activeDomains.length === 0) return null;

  const byDayAndDomain = new Map<string, Checkin>();
  for (const c of checkins) byDayAndDomain.set(`${c.date}__${c.domain_id}`, c);

  return (
    <div className="rounded-xl border border-border-subtle bg-surface-raised p-3">
      <p className="mb-2 text-xs font-semibold text-foreground-muted">Récap de la semaine</p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[280px] border-collapse text-xs">
          <thead>
            <tr>
              <th className="p-1 text-left font-normal text-foreground-muted"> </th>
              {activeDomains.map((d) => (
                <th key={d.id} className="p-1 text-center font-normal" title={d.name}>
                  {d.icon}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {days.map((day) => (
              <tr key={day} className="border-t border-border-subtle">
                <td className="whitespace-nowrap p-1 text-foreground-muted">{formatDateFr(day)}</td>
                {activeDomains.map((d) => {
                  const c = byDayAndDomain.get(`${day}__${d.id}`);
                  return (
                    <td key={d.id} className="p-1 text-center">
                      {c ? (
                        <span title={c.comment ?? undefined}>
                          {STATUS_ICON[c.status]}
                          {c.value_achieved != null && (
                            <span className="ml-0.5 text-[9px] text-foreground-muted">
                              {c.value_achieved}{d.target_unit ?? ""}
                            </span>
                          )}
                          {c.duration_minutes != null && (
                            <span className="ml-0.5 text-[9px] text-foreground-muted">
                              {c.duration_minutes}m
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-foreground-muted">·</span>
                      )}
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
