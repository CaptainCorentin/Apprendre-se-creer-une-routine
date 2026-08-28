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

export interface CheckinEdit {
  status: CheckinStatus | "none";
  duration_minutes: number | null;
  comment: string | null;
  value_achieved: number | null;
}

interface Props {
  checkinsByDate: Map<string, Checkin>;
  color: string;
  onEdit: (dateKey: string, edit: CheckinEdit) => void;
  todayKey: string;
  /** Domaine à cible hebdomadaire : un simple toggle "Fait" au lieu des 3 statuts. */
  flexible?: boolean;
  /** Domaine à objectif chiffré (ex: "2 L") : ajoute un champ valeur. */
  targetUnit?: string | null;
}

export function CatchupRow({ checkinsByDate, color, onEdit, todayKey, flexible, targetUnit }: Props) {
  const [open, setOpen] = useState(false);
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [status, setStatus] = useState<CheckinStatus>("done");
  const [minutes, setMinutes] = useState("");
  const [comment, setComment] = useState("");
  const [value, setValue] = useState("");
  const days = lastNDays(CATCHUP_DAYS).filter((d) => d !== todayKey);

  function startEditing(day: string) {
    const existing = checkinsByDate.get(day);
    if (flexible) {
      if (existing) {
        onEdit(day, { status: "none", duration_minutes: null, comment: null, value_achieved: null });
        return;
      }
      setMinutes("");
      setComment("");
      setValue("");
      setEditingDate(editingDate === day ? null : day);
      return;
    }
    setStatus(existing?.status ?? "done");
    setMinutes(existing?.duration_minutes?.toString() ?? "");
    setComment(existing?.comment ?? "");
    setValue(existing?.value_achieved?.toString() ?? "");
    setEditingDate(editingDate === day ? null : day);
  }

  function save(day: string) {
    onEdit(day, {
      status: flexible ? "done" : status,
      duration_minutes: minutes.trim() ? Number(minutes) : null,
      comment: comment.trim() ? comment.trim() : null,
      value_achieved: value.trim() ? Number(value) : null,
    });
    setEditingDate(null);
  }

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
                  onClick={() => startEditing(day)}
                  className="flex flex-col items-center gap-1 rounded-lg border border-border-subtle bg-surface-raised px-2 py-1.5 text-[10px]"
                  style={checkin ? { borderColor: color } : undefined}
                >
                  <span>{checkin ? STATUS_ICON[checkin.status] : "·"}</span>
                  <span className="text-foreground-muted">{formatDateFr(day)}</span>
                </button>
                {isEditing && (
                  <div className="absolute bottom-full left-1/2 z-10 mb-2 w-48 -translate-x-1/2 rounded-xl border border-border-subtle bg-surface-raised p-2 shadow-xl">
                    {!flexible && (
                      <div className="flex flex-col gap-1">
                        {(Object.keys(STATUS_LABEL) as CheckinStatus[]).map((s) => (
                          <button
                            key={s}
                            onClick={() => setStatus(s)}
                            className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs ${
                              status === s ? "bg-accent/15 text-accent-strong" : "hover:bg-surface"
                            }`}
                          >
                            <span>{STATUS_ICON[s]}</span>
                            {STATUS_LABEL[s]}
                          </button>
                        ))}
                      </div>
                    )}
                    {targetUnit && (
                      <input
                        type="number"
                        min={0}
                        step="any"
                        inputMode="decimal"
                        placeholder={`Valeur (${targetUnit})`}
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        className="mt-2 w-full rounded-lg border border-border-subtle bg-surface px-2 py-1 text-xs outline-none focus:border-accent"
                      />
                    )}
                    <input
                      type="number"
                      min={0}
                      inputMode="numeric"
                      placeholder="Minutes"
                      value={minutes}
                      onChange={(e) => setMinutes(e.target.value)}
                      className="mt-2 w-full rounded-lg border border-border-subtle bg-surface px-2 py-1 text-xs outline-none focus:border-accent"
                    />
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Commentaire…"
                      rows={2}
                      className="mt-1 w-full rounded-lg border border-border-subtle bg-surface px-2 py-1 text-xs outline-none focus:border-accent"
                    />
                    <button
                      onClick={() => save(day)}
                      className="mt-1 w-full rounded-lg bg-accent py-1.5 text-xs font-semibold text-white hover:bg-accent-strong"
                    >
                      Enregistrer
                    </button>
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
