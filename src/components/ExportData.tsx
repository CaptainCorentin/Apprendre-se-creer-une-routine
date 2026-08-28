"use client";

import { useState } from "react";
import { useAppContext } from "./AppProvider";
import { fetchAllMonthlyEntries, fetchAllWeeklyEntries, fetchCheckinsForExport } from "@/lib/data";

function csvEscape(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n;]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function downloadCsv(filename: string, header: string[], rows: (string | number | null | undefined)[][]) {
  const lines = [header.join(";"), ...rows.map((row) => row.map(csvEscape).join(";"))];
  const csv = "﻿" + lines.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const todayKey = () => new Date().toISOString().slice(0, 10);

export function ExportData() {
  const { profileId } = useAppContext();
  const [busy, setBusy] = useState<string | null>(null);

  async function exportCheckins() {
    if (!profileId) return;
    setBusy("checkins");
    try {
      const rows = await fetchCheckinsForExport(profileId);
      downloadCsv(
        `routine-checkins-${todayKey()}.csv`,
        ["date", "domaine", "statut", "valeur", "minutes", "commentaire"],
        rows.map((row) => [
          row.date,
          row.domains?.name ?? "",
          row.status,
          row.value_achieved,
          row.duration_minutes,
          row.comment,
        ])
      );
    } finally {
      setBusy(null);
    }
  }

  async function exportWeeklyJournal() {
    if (!profileId) return;
    setBusy("weekly");
    try {
      const entries = await fetchAllWeeklyEntries(profileId);
      downloadCsv(
        `routine-journal-hebdo-${todayKey()}.csv`,
        ["semaine_du", "ce_qui_a_bien_marche", "ce_qui_a_coince", "moment_ou_jai_tenu", "apprentissage_processus"],
        entries.map((e) => [e.week_start_date, e.went_well, e.got_stuck, e.pushed_through, e.process_learning])
      );
    } finally {
      setBusy(null);
    }
  }

  async function exportMonthlyJournal() {
    if (!profileId) return;
    setBusy("monthly");
    try {
      const entries = await fetchAllMonthlyEntries(profileId);
      downloadCsv(
        `routine-journal-mensuel-${todayKey()}.csv`,
        ["mois_du", "tendance_par_domaine", "plus_grand_apprentissage", "intention_mois_suivant"],
        entries.map((e) => [e.month_start_date, e.domain_trends, e.biggest_learning, e.next_month_intention])
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="mt-8">
      <h2 className="text-sm font-semibold text-foreground-muted">Exporter mes données</h2>
      <div className="carbon-panel mt-3 space-y-3 rounded-xl p-3">
        <div>
          <p className="text-xs text-foreground-muted">
            Check-ins quotidiens (un par jour et par domaine) : statut, valeur, minutes, commentaire.
          </p>
          <button
            onClick={exportCheckins}
            disabled={busy !== null}
            className="mt-2 w-full rounded-lg bg-accent py-2 text-sm font-semibold text-white hover:bg-accent-strong disabled:opacity-50"
          >
            {busy === "checkins" ? "Préparation…" : "Exporter les check-ins (CSV)"}
          </button>
        </div>
        <div>
          <p className="text-xs text-foreground-muted">Toutes tes entrées de journal hebdomadaire.</p>
          <button
            onClick={exportWeeklyJournal}
            disabled={busy !== null}
            className="mt-2 w-full rounded-lg border border-border-subtle py-2 text-sm font-medium text-foreground-muted hover:border-accent hover:text-accent-strong disabled:opacity-50"
          >
            {busy === "weekly" ? "Préparation…" : "Exporter le journal hebdo (CSV)"}
          </button>
        </div>
        <div>
          <p className="text-xs text-foreground-muted">Toutes tes entrées de journal mensuel.</p>
          <button
            onClick={exportMonthlyJournal}
            disabled={busy !== null}
            className="mt-2 w-full rounded-lg border border-border-subtle py-2 text-sm font-medium text-foreground-muted hover:border-accent hover:text-accent-strong disabled:opacity-50"
          >
            {busy === "monthly" ? "Préparation…" : "Exporter le journal mensuel (CSV)"}
          </button>
        </div>
      </div>
    </section>
  );
}
