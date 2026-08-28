"use client";

import { useState } from "react";
import { useAppContext } from "./AppProvider";
import { createDomain, updateDomain } from "@/lib/data";
import { DOMAIN_COLORS, DOMAIN_ICONS } from "@/lib/constants";

export function DomainsSettings() {
  const { profileId, domains, refreshDomains } = useAppContext();
  const [name, setName] = useState("");
  const [icon, setIcon] = useState(DOMAIN_ICONS[0]);
  const [color, setColor] = useState(DOMAIN_COLORS[0]);
  const [weeklyTarget, setWeeklyTarget] = useState<number | null>(null);
  const [targetValue, setTargetValue] = useState("");
  const [targetUnit, setTargetUnit] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !profileId) return;
    setBusy(true);
    try {
      await createDomain({
        profileId,
        name: name.trim(),
        icon,
        color,
        weekly_target: weeklyTarget,
        target_value: targetValue.trim() ? Number(targetValue) : null,
        target_unit: targetUnit.trim() || null,
      });
      setName("");
      setWeeklyTarget(null);
      setTargetValue("");
      setTargetUnit("");
      await refreshDomains();
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(id: string, active: boolean) {
    await updateDomain(id, { active: !active });
    await refreshDomains();
  }

  async function changeWeeklyTarget(id: string, value: string) {
    await updateDomain(id, { weekly_target: value === "" ? null : Number(value) });
    await refreshDomains();
  }

  async function changeTarget(id: string, value: string, unit: string) {
    await updateDomain(id, {
      target_value: value.trim() ? Number(value) : null,
      target_unit: unit.trim() || null,
    });
    await refreshDomains();
  }

  async function saveRename(id: string) {
    if (!editingName.trim()) return;
    await updateDomain(id, { name: editingName.trim() });
    setEditingId(null);
    await refreshDomains();
  }

  return (
    <section>
      <h2 className="text-sm font-semibold text-foreground-muted">Domaines</h2>

      <div className="mt-3 space-y-2">
        {domains.map((domain) => (
          <div key={domain.id} className="carbon-panel rounded-xl p-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">{domain.icon}</span>
              {editingId === domain.id ? (
                <input
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  className="flex-1 rounded-lg border border-border-subtle bg-surface-raised px-2 py-1 text-sm outline-none focus:border-accent"
                  autoFocus
                />
              ) : (
                <span className={`flex-1 text-sm ${!domain.active ? "text-foreground-muted line-through" : ""}`}>
                  {domain.name}
                </span>
              )}

              {editingId === domain.id ? (
                <button
                  onClick={() => saveRename(domain.id)}
                  className="text-xs font-medium text-accent-strong"
                >
                  OK
                </button>
              ) : (
                <button
                  onClick={() => {
                    setEditingId(domain.id);
                    setEditingName(domain.name);
                  }}
                  className="text-xs text-foreground-muted hover:text-accent-strong"
                >
                  Renommer
                </button>
              )}

              <button
                onClick={() => toggleActive(domain.id, domain.active)}
                className={`rounded-lg px-2 py-1 text-xs font-medium ${
                  domain.active
                    ? "bg-surface-raised text-foreground-muted hover:text-accent-strong"
                    : "bg-accent/15 text-accent-strong"
                }`}
              >
                {domain.active ? "Désactiver" : "Réactiver"}
              </button>
            </div>

            <div className="mt-2 flex items-center gap-2 pl-8">
              <span className="text-[11px] text-foreground-muted">Fréquence :</span>
              <select
                value={domain.weekly_target ?? ""}
                onChange={(e) => changeWeeklyTarget(domain.id, e.target.value)}
                className="rounded border border-border-subtle bg-surface-raised px-1.5 py-1 text-[11px]"
              >
                <option value="">Tous les jours</option>
                {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                  <option key={n} value={n}>
                    {n}x / semaine
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-2 flex items-center gap-2 pl-8">
              <span className="text-[11px] text-foreground-muted">Objectif :</span>
              <input
                type="number"
                min={0}
                step="any"
                defaultValue={domain.target_value ?? ""}
                onBlur={(e) => changeTarget(domain.id, e.target.value, domain.target_unit ?? "")}
                placeholder="Valeur"
                className="w-20 rounded border border-border-subtle bg-surface-raised px-1.5 py-1 text-[11px] outline-none focus:border-accent"
              />
              <input
                type="text"
                defaultValue={domain.target_unit ?? ""}
                onBlur={(e) => changeTarget(domain.id, domain.target_value?.toString() ?? "", e.target.value)}
                placeholder="Unité"
                className="w-24 rounded border border-border-subtle bg-surface-raised px-1.5 py-1 text-[11px] outline-none focus:border-accent"
              />
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleAdd} className="carbon-panel mt-4 rounded-xl p-3">
        <p className="mb-2 text-xs font-medium text-foreground-muted">Ajouter un domaine</p>
        <div className="flex items-center gap-2">
          <select
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            className="rounded-lg border border-border-subtle bg-surface-raised px-2 py-2 text-lg"
          >
            {DOMAIN_ICONS.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nom du domaine"
            className="flex-1 rounded-lg border border-border-subtle bg-surface-raised px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>
        <div className="mt-2 flex gap-2">
          {DOMAIN_COLORS.map((c) => (
            <button
              type="button"
              key={c}
              onClick={() => setColor(c)}
              className={`h-6 w-6 rounded-full border-2 transition ${
                color === c ? "scale-110 border-white" : "border-transparent"
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <select
            value={weeklyTarget ?? ""}
            onChange={(e) => setWeeklyTarget(e.target.value === "" ? null : Number(e.target.value))}
            className="rounded-lg border border-border-subtle bg-surface-raised px-2 py-1.5 text-xs"
          >
            <option value="">Tous les jours</option>
            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
              <option key={n} value={n}>
                {n}x / semaine
              </option>
            ))}
          </select>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <input
            type="number"
            min={0}
            step="any"
            placeholder="Objectif chiffré (optionnel)"
            value={targetValue}
            onChange={(e) => setTargetValue(e.target.value)}
            className="w-40 rounded-lg border border-border-subtle bg-surface-raised px-2 py-1.5 text-xs outline-none focus:border-accent"
          />
          <input
            type="text"
            placeholder="Unité (L, pages…)"
            value={targetUnit}
            onChange={(e) => setTargetUnit(e.target.value)}
            className="flex-1 rounded-lg border border-border-subtle bg-surface-raised px-2 py-1.5 text-xs outline-none focus:border-accent"
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="mt-3 w-full rounded-lg bg-accent py-2 text-sm font-semibold text-white hover:bg-accent-strong disabled:opacity-50"
        >
          Ajouter
        </button>
      </form>
    </section>
  );
}
