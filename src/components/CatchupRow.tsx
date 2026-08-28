"use client";

import { useState } from "react";
import type { Checkin, CheckinStatus } from "@/types/database";
import { CATCHUP_DAYS } from "@/lib/constants";
import { formatDateFr, lastNDays } from "@/lib/date";

const STATUS_ICON: Record<CheckinStatus, string> = {
  done: "✅",
  missed: "❌",
  rest_assumed: "🧊",
};

const STATUS_LABEL: Record<CheckinStatus, string> = {
  done: "Fait",
  missed: "Manqué",
  rest_assumed: "Repos assumé",
};

interface Props {
  checkinsByDate: Map<string, Checkin>;
  color: string;
  onEdit: (dateKey: string, status: CheckinStatus) => void;
  todayKey: string;
}

export function CatchupRow({ checkinsByDate, color, onEdit, todayKey }: Props) {
  const [open, setOpen] = useState(false);
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const days = lastNDays(CATCHUP_DAYS).filter((d) => d !== todayKey);

  return (
    <div className="mt-3">
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-xs font-medium text-foreground-muted underline decoration-dotted underline-offset-2 hover:text-accent-strong"
      >
        {open ? "Masquer" : "Rattraper les 14 derniers jours"}
      </button>

      {open && (
        <div className="mt-3 flex flex-wrap gap-2">
          {days.map((day) => {
            const checkin = checkinsByDate.get(day);
            const isEditing = editingDate === day;
            return (
              <div key={day} className="relative">
                <button
                  onClick={() => setEditingDate(isEditing ? null : day)}
                  className="flex flex-col items-center gap-1 rounded-lg border border-border-subtle bg-surface-raised px-2 py-1.5 text-[10px]"
                  style={checkin ? { borderColor: color } : undefined}
                >
                  <span>{checkin ? STATUS_ICON[checkin.status] : "·"}</span>
                  <span className="text-foreground-muted">{formatDateFr(day)}</span>
                </button>
                {isEditing && (
                  <div className="absolute bottom-full left-1/2 z-10 mb-2 w-36 -translate-x-1/2 rounded-xl border border-border-subtle bg-surface-raised p-1.5 shadow-xl">
                    {(Object.keys(STATUS_LABEL) as CheckinStatus[]).map((status) => (
                      <button
                        key={status}
                        onClick={() => {
                          onEdit(day, status);
                          setEditingDate(null);
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs hover:bg-surface"
                      >
                        <span>{STATUS_ICON[status]}</span>
                        {STATUS_LABEL[status]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
