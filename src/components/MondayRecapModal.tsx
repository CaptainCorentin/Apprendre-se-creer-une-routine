"use client";

import { useEffect, useState } from "react";
import { useAppContext } from "./AppProvider";
import { Avatar } from "./Avatar";
import { MessageComposer } from "./MessageComposer";
import { fetchWeeklySummaries } from "@/lib/groupMessages";
import { listProfiles } from "@/lib/profiles";
import type { ProfileWeekSummary } from "@/types/database";
import { addDays, formatWeekRangeFr, getEffectiveDate, getWeekStart, toDateKey } from "@/lib/date";

const DISMISSED_KEY = "routine:monday-recap-dismissed-date";

export function MondayRecapModal() {
  const { ready, profileId, domains } = useAppContext();
  const [open, setOpen] = useState(false);
  const [weekKey, setWeekKey] = useState<string | null>(null);
  const [summaries, setSummaries] = useState<ProfileWeekSummary[]>([]);
  const [composerTarget, setComposerTarget] = useState<{
    profileId: string;
    name: string;
    acceptsPiquant: boolean;
  } | null>(null);

  useEffect(() => {
    if (!ready || !profileId || domains.length === 0) return;

    async function check() {
      const today = getEffectiveDate();
      if (today.getDay() !== 1) return; // lundi uniquement

      const todayKey = toDateKey(today);
      if (typeof window !== "undefined" && window.localStorage.getItem(DISMISSED_KEY) === todayKey) return;

      const profiles = await listProfiles();
      const me = profiles.find((p) => p.id === profileId);
      if (me && !me.shows_monday_recap) return;

      const lastWeekStart = toDateKey(addDays(getWeekStart(today), -7));
      const data = await fetchWeeklySummaries(lastWeekStart);
      setWeekKey(lastWeekStart);
      setSummaries(data.filter((s) => s.profileId !== profileId && s.hasActivity));
      setOpen(true);
    }

    check();
  }, [ready, profileId, domains.length]);

  function dismiss() {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(DISMISSED_KEY, toDateKey(getEffectiveDate()));
    }
    setOpen(false);
  }

  if (!open || !weekKey) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      {composerTarget && profileId ? (
        <MessageComposer
          fromProfileId={profileId}
          target={composerTarget}
          weekStartKey={weekKey}
          onSent={() => setComposerTarget(null)}
          onCancel={() => setComposerTarget(null)}
        />
      ) : (
        <div className="modal-in carbon-panel max-h-[85vh] w-full max-w-sm overflow-y-auto rounded-2xl p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent-strong">
            Récap de la semaine — Entre nous
          </p>
          <p className="mt-1 text-xs text-foreground-muted">Semaine du {formatWeekRangeFr(weekKey)}</p>

          <div className="mt-4 space-y-3">
            {summaries.length === 0 && (
              <p className="text-sm text-foreground-muted">Aucun autre profil pour le moment.</p>
            )}
            {summaries.map((summary) => (
              <div key={summary.profileId} className="rounded-xl bg-surface-raised p-3">
                <div className="flex items-center gap-2">
                  <Avatar name={summary.profileName} photoUrl={summary.profilePhotoUrl} size={28} />
                  <p className="text-sm font-semibold">{summary.profileName}</p>
                </div>
                <div className="mt-2 space-y-1.5">
                  {summary.domains.map((d) => (
                    <div key={d.id} className="flex items-center justify-between text-xs">
                      <span>
                        {d.icon} {d.name}
                      </span>
                      <span className="text-foreground-muted">
                        {d.done}/{d.target}
                      </span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() =>
                    setComposerTarget({
                      profileId: summary.profileId,
                      name: summary.profileName,
                      acceptsPiquant: summary.acceptsPiquant,
                    })
                  }
                  className="mt-2 w-full rounded-lg bg-accent py-1.5 text-xs font-semibold text-white hover:bg-accent-strong"
                >
                  Envoyer un message
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={dismiss}
            className="mt-4 w-full rounded-xl border border-border-subtle py-2.5 text-sm text-foreground-muted hover:border-accent hover:text-accent-strong"
          >
            Fermer
          </button>
        </div>
      )}
    </div>
  );
}
