"use client";

import { useState } from "react";
import type { Checkin } from "@/types/database";

interface Props {
  checkin: Checkin | undefined;
  targetUnit?: string | null;
  onSave: (details: { duration_minutes: number | null; comment: string | null; value_achieved: number | null }) => void;
}

export function CheckinDetailsEditor({ checkin, targetUnit, onSave }: Props) {
  const [open, setOpen] = useState(false);
  const [minutes, setMinutes] = useState(checkin?.duration_minutes?.toString() ?? "");
  const [comment, setComment] = useState(checkin?.comment ?? "");
  const [value, setValue] = useState(checkin?.value_achieved?.toString() ?? "");

  if (!checkin) return null;

  const hasDetails =
    checkin.duration_minutes != null ||
    (checkin.comment && checkin.comment.length > 0) ||
    checkin.value_achieved != null;

  if (!open) {
    const parts = [
      checkin.value_achieved != null ? `${checkin.value_achieved}${targetUnit ? ` ${targetUnit}` : ""}` : null,
      checkin.duration_minutes != null ? `${checkin.duration_minutes} min` : null,
      checkin.comment || null,
    ].filter(Boolean);

    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-3 text-xs text-foreground-muted underline decoration-dotted underline-offset-2 hover:text-accent-strong"
      >
        {hasDetails ? parts.join(" · ") : "+ Ajouter un temps / commentaire"}
      </button>
    );
  }

  return (
    <div className="mt-3 rounded-xl border border-border-subtle bg-surface-raised p-3">
      {targetUnit && (
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            step="any"
            inputMode="decimal"
            placeholder="Valeur"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-24 rounded-lg border border-border-subtle bg-surface px-2 py-1.5 text-sm outline-none focus:border-accent"
          />
          <span className="text-xs text-foreground-muted">{targetUnit}</span>
        </div>
      )}
      <div className="mt-2 flex items-center gap-2">
        <input
          type="number"
          min={0}
          inputMode="numeric"
          placeholder="Minutes"
          value={minutes}
          onChange={(e) => setMinutes(e.target.value)}
          className="w-24 rounded-lg border border-border-subtle bg-surface px-2 py-1.5 text-sm outline-none focus:border-accent"
        />
        <span className="text-xs text-foreground-muted">min</span>
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Un commentaire sur ta séance…"
        rows={2}
        className="mt-2 w-full rounded-lg border border-border-subtle bg-surface px-2 py-1.5 text-sm outline-none focus:border-accent"
      />
      <div className="mt-2 flex gap-2">
        <button
          onClick={() => {
            onSave({
              duration_minutes: minutes.trim() ? Number(minutes) : null,
              comment: comment.trim() ? comment.trim() : null,
              value_achieved: value.trim() ? Number(value) : null,
            });
            setOpen(false);
          }}
          className="flex-1 rounded-lg bg-accent py-1.5 text-xs font-semibold text-white hover:bg-accent-strong"
        >
          Enregistrer
        </button>
        <button
          onClick={() => setOpen(false)}
          className="rounded-lg border border-border-subtle px-3 py-1.5 text-xs text-foreground-muted"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}
