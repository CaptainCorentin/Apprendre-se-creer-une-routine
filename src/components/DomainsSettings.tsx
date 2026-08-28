"use client";

import { useState } from "react";
import { useAppContext } from "./AppProvider";
import { createDomain, updateDomain } from "@/lib/data";
import { DOMAIN_COLORS, DOMAIN_ICONS } from "@/lib/constants";

export function DomainsSettings() {
  const { domains, refreshDomains } = useAppContext();
  const [name, setName] = useState("");
  const [icon, setIcon] = useState(DOMAIN_ICONS[0]);
  const [color, setColor] = useState(DOMAIN_COLORS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      await createDomain({ name: name.trim(), icon, color });
      setName("");
      await refreshDomains();
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(id: string, active: boolean) {
    await updateDomain(id, { active: !active });
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
          <div
            key={domain.id}
            className="carbon-panel flex items-center gap-2 rounded-xl p-3"
          >
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
