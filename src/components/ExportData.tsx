"use client";

import { useState } from "react";
import { useAppContext } from "./AppProvider";
import { fetchCheckinsForExport } from "@/lib/data";

function csvEscape(value: string | number | null): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n;]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function ExportData() {
  const { profileId } = useAppContext();
  const [busy, setBusy] = useState(false);

  async function handleExport() {
    if (!profileId) return;
    setBusy(true);
    try {
      const rows = await fetchCheckinsForExport(profileId);
      const header = ["date", "domaine", "statut", "valeur", "minutes", "commentaire"];
      const lines = [header.join(";")];
      for (const row of rows) {
        lines.push(
          [
            row.date,
            csvEscape(row.domains?.name ?? ""),
            row.status,
            csvEscape(row.value_achieved),
            csvEscape(row.duration_minutes),
            csvEscape(row.comment),
          ].join(";")
        );
      }
      const csv = "﻿" + lines.join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `routine-export-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-8">
      <h2 className="text-sm font-semibold text-foreground-muted">Exporter mes données</h2>
      <div className="carbon-panel mt-3 rounded-xl p-3">
        <p className="text-xs text-foreground-muted">
          Télécharge l&apos;historique complet de tes check-ins (un par jour et par domaine) au format CSV,
          pour l&apos;analyser dans un tableur ou ailleurs.
        </p>
        <button
          onClick={handleExport}
          disabled={busy}
          className="mt-3 w-full rounded-lg bg-accent py-2 text-sm font-semibold text-white hover:bg-accent-strong disabled:opacity-50"
        >
          {busy ? "Préparation…" : "Exporter en CSV"}
        </button>
      </div>
    </section>
  );
}
