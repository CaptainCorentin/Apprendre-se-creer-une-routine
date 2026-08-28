"use client";

import { useEffect, useState } from "react";
import type { MonthlyJournalEntry, WeeklyJournalEntry } from "@/types/database";
import { fetchMonthlyEntry, fetchWeeklyEntriesInMonth, upsertMonthlyEntry } from "@/lib/data";
import { formatMonthFr, formatWeekRangeFr, fromDateKey } from "@/lib/date";

const FIELDS: {
  key: keyof Pick<MonthlyJournalEntry, "domain_trends" | "biggest_learning" | "next_month_intention">;
  label: string;
  placeholder: string;
}[] = [
  { key: "domain_trends", label: "Tendance par domaine ce mois-ci", placeholder: "Sur le mois écoulé, tel domaine a…" },
  { key: "biggest_learning", label: "Le plus grand apprentissage du mois", placeholder: "Ce mois-ci, j'ai surtout retenu que…" },
  { key: "next_month_intention", label: "Intention pour le mois suivant", placeholder: "Le mois prochain, je veux…" },
];

interface Props {
  monthStartKey: string;
  onSaved?: () => void;
  forced?: boolean;
}

export function MonthlyJournalForm({ monthStartKey, onSaved, forced }: Props) {
  const [values, setValues] = useState({
    domain_trends: "",
    biggest_learning: "",
    next_month_intention: "",
  });
  const [weeklyRecap, setWeeklyRecap] = useState<WeeklyJournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchMonthlyEntry(monthStartKey), fetchWeeklyEntriesInMonth(monthStartKey)]).then(
      ([entry, weeks]) => {
        if (cancelled) return;
        if (entry) {
          setValues({
            domain_trends: entry.domain_trends,
            biggest_learning: entry.biggest_learning,
            next_month_intention: entry.next_month_intention,
          });
        }
        setWeeklyRecap(weeks);
        setLoading(false);
      }
    );
    return () => {
      cancelled = true;
    };
  }, [monthStartKey]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await upsertMonthlyEntry(monthStartKey, values);
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
        <p className="text-sm font-semibold">Journal mensuel</p>
        <p className="text-xs capitalize text-foreground-muted">{formatMonthFr(fromDateKey(monthStartKey))}</p>
      </div>

      {weeklyRecap.length > 0 && (
        <div className="rounded-xl border border-border-subtle bg-surface-raised p-3">
          <p className="mb-2 text-xs font-semibold text-foreground-muted">
            Récap des entrées hebdomadaires du mois
          </p>
          <div className="max-h-48 space-y-3 overflow-y-auto pr-1">
            {weeklyRecap.map((w) => (
              <div key={w.id} className="text-xs">
                <p className="font-medium text-accent-strong">
                  Semaine du {formatWeekRangeFr(w.week_start_date)}
                </p>
                <p className="mt-0.5 text-foreground-muted">✅ {w.went_well}</p>
                <p className="text-foreground-muted">🧗 {w.got_stuck}</p>
                <p className="text-foreground-muted">💪 {w.pushed_through}</p>
                <p className="text-foreground-muted">📚 {w.process_learning}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {weeklyRecap.length === 0 && (
        <p className="text-xs text-foreground-muted">
          Aucune entrée hebdomadaire enregistrée ce mois-ci.
        </p>
      )}

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
          Remplis les 3 champs pour valider le bilan du mois.
        </p>
      )}
    </form>
  );
}
