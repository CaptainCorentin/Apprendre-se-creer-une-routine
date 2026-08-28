"use client";

import { useEffect, useState } from "react";
import { useAppContext } from "./AppProvider";
import { WeeklyJournalForm } from "./WeeklyJournalForm";
import { MonthlyJournalForm } from "./MonthlyJournalForm";
import { fetchMonthlyEntry, fetchWeeklyEntry } from "@/lib/data";
import {
  addDays,
  getEffectiveDate,
  getMonthStart,
  getWeekStart,
  isFirstSundayOfMonth,
  toDateKey,
} from "@/lib/date";
import { WEEKLY_REMINDER_WEEKDAY } from "@/lib/constants";

type Step = "checking" | "weekly" | "monthly" | "done";

export function ForcedJournalModals() {
  const { ready, profileId, domains, refreshJournalDue } = useAppContext();
  const [step, setStep] = useState<Step>("checking");
  const [weekStartKey, setWeekStartKey] = useState<string | null>(null);
  const [prevMonthStartKey, setPrevMonthStartKey] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !profileId || domains.length === 0) return;

    async function check() {
      const today = getEffectiveDate();
      const isWeeklyReminderDay = today.getDay() === WEEKLY_REMINDER_WEEKDAY;
      const isMonthlyReminderDay = isFirstSundayOfMonth(today);

      let needsWeekly = false;
      let currentWeekKey = "";
      if (isWeeklyReminderDay) {
        currentWeekKey = toDateKey(getWeekStart(today));
        const entry = await fetchWeeklyEntry(profileId!, currentWeekKey);
        needsWeekly = !entry;
      }

      let needsMonthly = false;
      let elapsedMonthKey = "";
      if (isMonthlyReminderDay) {
        const previousMonthDate = addDays(getMonthStart(today), -1);
        elapsedMonthKey = toDateKey(getMonthStart(previousMonthDate));
        const entry = await fetchMonthlyEntry(profileId!, elapsedMonthKey);
        needsMonthly = !entry;
      }

      setWeekStartKey(currentWeekKey || null);
      setPrevMonthStartKey(elapsedMonthKey || null);

      if (needsWeekly) {
        setStep("weekly");
      } else if (needsMonthly) {
        setStep("monthly");
      } else {
        setStep("done");
      }
    }

    check();
  }, [ready, profileId, domains.length]);

  if (step === "checking" || step === "done") return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="modal-in carbon-panel max-h-[85vh] w-full max-w-sm overflow-y-auto rounded-2xl p-5 shadow-2xl shadow-black/60">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-accent-strong">
          Rendez-vous obligatoire
        </p>
        {step === "weekly" && weekStartKey && (
          <WeeklyJournalForm
            weekStartKey={weekStartKey}
            forced
            onSaved={() => {
              refreshJournalDue();
              if (prevMonthStartKey) {
                setStep("monthly");
              } else {
                setStep("done");
              }
            }}
          />
        )}
        {step === "monthly" && prevMonthStartKey && (
          <MonthlyJournalForm
            monthStartKey={prevMonthStartKey}
            forced
            onSaved={() => {
              refreshJournalDue();
              setStep("done");
            }}
          />
        )}
      </div>
    </div>
  );
}
