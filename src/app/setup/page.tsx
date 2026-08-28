"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/components/AppProvider";
import { createDomain } from "@/lib/data";
import { DOMAIN_COLORS, DOMAIN_ICONS } from "@/lib/constants";

interface DraftDomain {
  name: string;
  icon: string;
  color: string;
  weeklyTarget: number | null;
  targetValue: string;
  targetUnit: string;
}

export default function SetupPage() {
  const { profileId, refreshDomains } = useAppContext();
  const router = useRouter();
  const [drafts, setDrafts] = useState<DraftDomain[]>([
    { name: "", icon: DOMAIN_ICONS[0], color: DOMAIN_COLORS[0], weeklyTarget: null, targetValue: "", targetUnit: "" },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateDraft(index: number, patch: Partial<DraftDomain>) {
    setDrafts((prev) => prev.map((d, i) => (i === index ? { ...d, ...patch } : d)));
  }

  function addDraft() {
    setDrafts((prev) => [
      ...prev,
      {
        name: "",
        icon: DOMAIN_ICONS[prev.length % DOMAIN_ICONS.length],
        color: DOMAIN_COLORS[prev.length % DOMAIN_COLORS.length],
        weeklyTarget: null,
        targetValue: "",
        targetUnit: "",
      },
    ]);
  }

  function removeDraft(index: number) {
    setDrafts((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const valid = drafts.filter((d) => d.name.trim().length > 0);
    if (valid.length === 0) {
      setError("Ajoute au moins un domaine pour continuer.");
      return;
    }
    if (!profileId) return;
    setSubmitting(true);
    setError(null);
    try {
      for (const draft of valid) {
        await createDomain({
          profileId,
          name: draft.name.trim(),
          icon: draft.icon,
          color: draft.color,
          weekly_target: draft.weeklyTarget,
          target_value: draft.targetValue.trim() ? Number(draft.targetValue) : null,
          target_unit: draft.targetUnit.trim() || null,
        });
      }
      await refreshDomains();
      router.replace("/");
    } catch (err) {
      setError("Une erreur est survenue. Réessaie.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-12">
      <div className="mb-8 text-center">
        <p className="text-5xl">🔥</p>
        <h1 className="mt-4 text-2xl font-bold tracking-tight">Bienvenue.</h1>
        <p className="mt-2 text-sm text-foreground-muted">
          Avant de commencer, crée au moins un domaine à suivre. C&apos;est ta routine, ta discipline.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {drafts.map((draft, index) => (
          <div key={index} className="carbon-panel rounded-2xl p-4">
            <div className="flex items-center gap-2">
              <select
                value={draft.icon}
                onChange={(e) => updateDraft(index, { icon: e.target.value })}
                className="rounded-lg border border-border-subtle bg-surface-raised px-2 py-2 text-lg"
              >
                {DOMAIN_ICONS.map((icon) => (
                  <option key={icon} value={icon}>
                    {icon}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Ex : Sport, Lecture, Piano…"
                value={draft.name}
                onChange={(e) => updateDraft(index, { name: e.target.value })}
                className="flex-1 rounded-lg border border-border-subtle bg-surface-raised px-3 py-2 text-sm outline-none focus:border-accent"
              />
              {drafts.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeDraft(index)}
                  className="text-foreground-muted hover:text-accent-strong"
                  aria-label="Supprimer"
                >
                  ✕
                </button>
              )}
            </div>
            <div className="mt-3 flex gap-2">
              {DOMAIN_COLORS.map((color) => (
                <button
                  type="button"
                  key={color}
                  onClick={() => updateDraft(index, { color })}
                  className={`h-6 w-6 rounded-full border-2 transition ${
                    draft.color === color ? "border-white scale-110" : "border-transparent"
                  }`}
                  style={{ backgroundColor: color }}
                  aria-label={`Couleur ${color}`}
                />
              ))}
            </div>

            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => updateDraft(index, { weeklyTarget: null })}
                className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition ${
                  draft.weeklyTarget === null
                    ? "bg-accent text-white"
                    : "bg-surface-raised text-foreground-muted"
                }`}
              >
                Tous les jours
              </button>
              <button
                type="button"
                onClick={() => updateDraft(index, { weeklyTarget: draft.weeklyTarget ?? 3 })}
                className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition ${
                  draft.weeklyTarget !== null
                    ? "bg-accent text-white"
                    : "bg-surface-raised text-foreground-muted"
                }`}
              >
                X fois / semaine
              </button>
              {draft.weeklyTarget !== null && (
                <select
                  value={draft.weeklyTarget}
                  onChange={(e) => updateDraft(index, { weeklyTarget: Number(e.target.value) })}
                  className="rounded-lg border border-border-subtle bg-surface-raised px-2 py-1.5 text-xs"
                >
                  {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                    <option key={n} value={n}>
                      {n}x
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="mt-2 flex items-center gap-2">
              <input
                type="number"
                min={0}
                step="any"
                placeholder="Objectif chiffré (optionnel)"
                value={draft.targetValue}
                onChange={(e) => updateDraft(index, { targetValue: e.target.value })}
                className="w-40 rounded-lg border border-border-subtle bg-surface-raised px-2 py-1.5 text-xs outline-none focus:border-accent"
              />
              <input
                type="text"
                placeholder="Unité (L, pages…)"
                value={draft.targetUnit}
                onChange={(e) => updateDraft(index, { targetUnit: e.target.value })}
                className="flex-1 rounded-lg border border-border-subtle bg-surface-raised px-2 py-1.5 text-xs outline-none focus:border-accent"
              />
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addDraft}
          className="w-full rounded-xl border border-dashed border-border-subtle py-2.5 text-sm text-foreground-muted transition hover:border-accent hover:text-accent-strong"
        >
          + Ajouter un domaine
        </button>

        {error && <p className="text-sm text-accent-strong">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-accent py-3 text-sm font-semibold text-white transition hover:bg-accent-strong disabled:opacity-50"
        >
          {submitting ? "Création…" : "Entrer dans l'app"}
        </button>
      </form>
    </div>
  );
}
