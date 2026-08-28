"use client";

import { useEffect, useState } from "react";
import { WeeklyJournalForm } from "@/components/WeeklyJournalForm";
import { MonthlyJournalForm } from "@/components/MonthlyJournalForm";
import { useAppContext } from "@/components/AppProvider";
import { fetchAllMonthlyEntries, fetchAllWeeklyEntries } from "@/lib/data";
import { checkJournalDue } from "@/lib/journalStatus";
import type { MonthlyJournalEntry, WeeklyJournalEntry } from "@/types/database";
import { formatMonthFr, formatWeekRangeFr, fromDateKey, getMonthStart, getWeekStart, toDateKey } from "@/lib/date";

type Tab = "hebdo" | "mensuel";

export default function JournalPage() {
  const { profileId, refreshJournalDue } = useAppContext();
  const [tab, setTab] = useState<Tab>("hebdo");
  const [weeklyHistory, setWeeklyHistory] = useState<WeeklyJournalEntry[]>([]);
  const [monthlyHistory, setMonthlyHistory] = useState<MonthlyJournalEntry[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [weekKey, setWeekKey] = useState(() => toDateKey(getWeekStart(new Date())));
  const [monthKey, setMonthKey] = useState(() => toDateKey(getMonthStart(new Date())));

  useEffect(() => {
    if (!profileId) return;
    fetchAllWeeklyEntries(profileId).then(setWeeklyHistory);
    fetchAllMonthlyEntries(profileId).then(setMonthlyHistory);
    checkJournalDue(profileId).then((status) => {
      setWeekKey(status.weekly ? status.weekKey : toDateKey(getWeekStart(new Date())));
      if (status.monthly && status.monthKey) {
        setMonthKey(status.monthKey);
        setTab((current) => (current === "hebdo" && !status.weekly ? "mensuel" : current));
      } else {
        setMonthKey(toDateKey(getMonthStart(new Date())));
      }
    });
  }, [profileId, refreshKey]);

  function handleSaved() {
    setRefreshKey((k) => k + 1);
    refreshJournalDue();
  }

  return (
    <div className="mx-auto max-w-md px-4 pt-8">
      <h1 className="text-xl font-bold tracking-tight">Journal</h1>
      <p className="mt-1 text-sm text-foreground-muted">Bilan hebdomadaire et mensuel de ta progression.</p>

      <div className="mt-5 flex gap-2 rounded-xl bg-surface-raised p-1">
        <button
          onClick={() => setTab("hebdo")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
            tab === "hebdo" ? "bg-accent text-white" : "text-foreground-muted"
          }`}
        >
          Hebdomadaire
        </button>
        <button
          onClick={() => setTab("mensuel")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
            tab === "mensuel" ? "bg-accent text-white" : "text-foreground-muted"
          }`}
        >
          Mensuel
        </button>
      </div>

      <div className="mt-5 carbon-panel rounded-2xl p-4">
        {tab === "hebdo" ? (
          <WeeklyJournalForm key={`week-${weekKey}-${refreshKey}`} weekStartKey={weekKey} onSaved={handleSaved} />
        ) : (
          <MonthlyJournalForm key={`month-${monthKey}-${refreshKey}`} monthStartKey={monthKey} onSaved={handleSaved} />
        )}
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-semibold text-foreground-muted">
          {tab === "hebdo" ? "Historique hebdomadaire" : "Historique mensuel"}
        </h2>

        {tab === "hebdo" && (
          <div className="mt-3 space-y-3">
            {weeklyHistory.length === 0 && (
              <p className="text-sm text-foreground-muted">Aucune entrée pour le moment.</p>
            )}
            {weeklyHistory.map((entry) => (
              <div key={entry.id} className="carbon-panel rounded-xl p-3 text-sm">
                <p className="font-medium text-accent-strong">
                  Semaine du {formatWeekRangeFr(entry.week_start_date)}
                </p>
                <p className="mt-1 text-foreground-muted">✅ {entry.went_well}</p>
                <p className="text-foreground-muted">🧗 {entry.got_stuck}</p>
                <p className="text-foreground-muted">💪 {entry.pushed_through}</p>
                <p className="text-foreground-muted">📚 {entry.process_learning}</p>
              </div>
            ))}
          </div>
        )}

        {tab === "mensuel" && (
          <div className="mt-3 space-y-3">
            {monthlyHistory.length === 0 && (
              <p className="text-sm text-foreground-muted">Aucune entrée pour le moment.</p>
            )}
            {monthlyHistory.map((entry) => (
              <div key={entry.id} className="carbon-panel rounded-xl p-3 text-sm">
                <p className="font-medium capitalize text-accent-strong">
                  {formatMonthFr(fromDateKey(entry.month_start_date))}
                </p>
                <p className="mt-1 text-foreground-muted">📈 {entry.domain_trends}</p>
                <p className="text-foreground-muted">💡 {entry.biggest_learning}</p>
                <p className="text-foreground-muted">🎯 {entry.next_month_intention}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
