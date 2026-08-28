"use client";

import { useEffect, useState } from "react";
import type { WeeklyJournalEntry } from "@/types/database";
import { fetchWeeklyEntry, upsertWeeklyEntry } from "@/lib/data";
import { formatWeekRangeFr } from "@/lib/date";

const FIELDS: { key: keyof Pick<WeeklyJournalEntry, "went_well" | "got_stuck" | "pushed_through" | "process_learning">; label: string; placeholder: string }[] = [
  { key: "went_well", label: "Ce qui a bien marché", placeholder: "Cette semaine, j'ai réussi à…" },
  { key: "got_stuck", label: "Ce qui a coincé", placeholder: "J'ai eu du mal avec…" },
  { key: "pushed_through", label: "Un moment où j'ai tenu", placeholder: "Malgré la fatigue / l'envie de lâcher, j'ai…" },
  { key: "process_learning", label: "Un apprentissage sur le processus", placeholder: "J'ai compris que…" },
];

interface Props {
  weekStartKey: string;
  onSaved?: () => void;
  forced?: boolean;
}

export function WeeklyJournalForm({ weekStartKey, onSaved, forced }: Props) {
  const [values, setValues] = useState({
    went_well: "",
    got_stuck: "",
    pushed_through: "",
    process_learning: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchWeeklyEntry(weekStartKey).then((entry) => {
      if (cancelled) return;
      if (entry) {
        setValues({
          went_well: entry.went_well,
          got_stuck: entry.got_stuck,
          pushed_through: entry.pushed_through,
          process_learning: entry.process_learning,
        });
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [weekStartKey]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await upsertWeeklyEntry(weekStartKey, values);
      onSaved?.();
    } finally {
      setSaving(false);
    }
  }

  const isComplete = Object.values(values).every((v) => v.trim().length > 0);

  if (loading) return <p className="text-sm text-foreground-muted">Chargement…</p>;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <p className="text-sm font-semibold">Journal hebdomadaire</p>
        <p className="text-xs text-foreground-muted">Semaine du {formatWeekRangeFr(weekStartKey)}</p>
      </div>
      {FIELDS.map((field) => (
        <div key={field.key}>
          <label className="mb-1 block text-xs font-medium text-foreground-muted">{field.label}</label>
          <textarea
            value={values[field.key]}
            onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
            placeholder={field.placeholder}
            rows={2}
            className="w-full rounded-lg border border-border-subtle bg-surface-raised px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>
      ))}
      <button
        type="submit"
        disabled={saving || (forced && !isComplete)}
        className="w-full rounded-xl bg-accent py-2.5 text-sm font-semibold text-white transition hover:bg-accent-strong disabled:opacity-50"
      >
        {saving ? "Enregistrement…" : "Enregistrer"}
      </button>
      {forced && !isComplete && (
        <p className="text-center text-[11px] text-foreground-muted">
          Remplis les 4 champs pour valider le bilan de la semaine.
        </p>
      )}
    </form>
  );
}
