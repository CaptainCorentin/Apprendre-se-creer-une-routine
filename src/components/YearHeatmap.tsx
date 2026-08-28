"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchCheckinsSince } from "@/lib/data";
import type { Checkin } from "@/types/database";
import { addDays, getEffectiveDate, getWeekStart, toDateKey } from "@/lib/date";

const WEEKS = 53;

interface Props {
  domainId: string;
  color: string;
}

export function YearHeatmap({ domainId, color }: Props) {
  const [checkins, setCheckins] = useState<Checkin[] | null>(null);

  const startKey = useMemo(() => {
    const today = getEffectiveDate();
    const start = getWeekStart(addDays(today, -(WEEKS - 1) * 7));
    return toDateKey(start);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchCheckinsSince(domainId, startKey).then((data) => {
      if (!cancelled) setCheckins(data);
    });
    return () => {
      cancelled = true;
    };
  }, [domainId, startKey]);

  const weeks = useMemo(() => {
    const byDate = new Map((checkins ?? []).map((c) => [c.date, c]));
    const start = new Date(startKey);
    const result: { date: string; checkin: Checkin | undefined }[][] = [];
    for (let w = 0; w < WEEKS; w++) {
      const week: { date: string; checkin: Checkin | undefined }[] = [];
      for (let d = 0; d < 7; d++) {
        const date = toDateKey(addDays(start, w * 7 + d));
        week.push({ date, checkin: byDate.get(date) });
      }
      result.push(week);
    }
    return result;
  }, [checkins, startKey]);

  function cellColor(checkin: Checkin | undefined): string {
    if (!checkin) return "var(--border-subtle)";
    if (checkin.status === "done") return color;
    if (checkin.status === "rest_assumed") return "var(--rest)";
    return "rgba(225, 29, 47, 0.35)";
  }

  if (checkins === null) {
    return <p className="text-xs text-foreground-muted">Chargement de l&apos;historique…</p>;
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-[3px]" style={{ width: "max-content" }}>
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.map(({ date, checkin }) => (
              <div
                key={date}
                title={`${date}${checkin ? ` · ${checkin.status}` : ""}`}
                className="h-[10px] w-[10px] rounded-[2px]"
                style={{ backgroundColor: cellColor(checkin) }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
