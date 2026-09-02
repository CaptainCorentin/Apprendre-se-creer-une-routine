"use client";

import { useEffect, useState } from "react";
import { useAppContext } from "@/components/AppProvider";
import { MessageComposer } from "@/components/MessageComposer";
import { fetchReceivedMessages, fetchWeeklySummaries, markMessagesRead } from "@/lib/groupMessages";
import type { GroupMessage, MessageKind, ProfileWeekSummary } from "@/types/database";
import { formatWeekRangeFr, getWeekStart, toDateKey } from "@/lib/date";
import { listProfiles } from "@/lib/profiles";

const KIND_LABEL: Record<MessageKind, string> = {
  encouragement: "👏 Encouragement",
  piquant: "😈 Pique",
};

export default function EntreNousPage() {
  const { profileId, refreshUnreadMessages } = useAppContext();
  const [summaries, setSummaries] = useState<ProfileWeekSummary[] | null>(null);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [profileNames, setProfileNames] = useState<Record<string, string>>({});
  const [composerTarget, setComposerTarget] = useState<{
    profileId: string;
    name: string;
    acceptsPiquant: boolean;
  } | null>(null);

  const weekKey = toDateKey(getWeekStart(new Date()));

  useEffect(() => {
    if (!profileId) return;
    fetchWeeklySummaries(weekKey).then(setSummaries);
    fetchReceivedMessages(profileId).then(setMessages);
    listProfiles().then((list) => {
      setProfileNames(Object.fromEntries(list.map((p) => [p.id, p.name])));
    });
    markMessagesRead(profileId).then(refreshUnreadMessages);
  }, [profileId, weekKey, refreshUnreadMessages]);

  return (
    <div className="mx-auto max-w-md px-4 pt-8">
      <h1 className="text-xl font-bold tracking-tight">Entre nous</h1>
      <p className="mt-1 text-sm text-foreground-muted">
        Le récap hebdo de tout le monde. Semaine du {formatWeekRangeFr(weekKey)}.
      </p>

      <div className="mt-6 space-y-4">
        {summaries === null && <p className="text-sm text-foreground-muted">Chargement…</p>}
        {summaries
          ?.filter((s) => s.profileId !== profileId)
          .map((summary) => (
            <div key={summary.profileId} className="carbon-panel rounded-2xl p-4">
              <h2 className="font-semibold">{summary.profileName}</h2>
              <div className="mt-3 space-y-2">
                {!summary.hasActivity && (
                  <p className="text-xs text-foreground-muted">Pas d&apos;imputations cette semaine.</p>
                )}
                {summary.hasActivity && summary.domains.length === 0 && (
                  <p className="text-xs text-foreground-muted">Aucun domaine actif.</p>
                )}
                {summary.hasActivity &&
                  summary.domains.map((d) => (
                    <div key={d.id}>
                      <div className="flex items-center justify-between text-xs">
                        <span>
                          {d.icon} {d.name}
                        </span>
                        <span className="text-foreground-muted">
                          {d.done}/{d.target}
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surface-raised">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(d.done / d.target, 1) * 100}%`,
                            backgroundColor: d.color,
                          }}
                        />
                      </div>
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
                className="mt-3 w-full rounded-lg border border-border-subtle py-2 text-xs font-medium text-foreground-muted hover:border-accent hover:text-accent-strong"
              >
                Envoyer un message
              </button>
            </div>
          ))}
        {summaries?.filter((s) => s.profileId !== profileId).length === 0 && (
          <p className="text-sm text-foreground-muted">Aucun autre profil pour le moment.</p>
        )}
      </div>

      {composerTarget && profileId && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center">
          <MessageComposer
            fromProfileId={profileId}
            target={composerTarget}
            weekStartKey={weekKey}
            onSent={() => setComposerTarget(null)}
            onCancel={() => setComposerTarget(null)}
          />
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-sm font-semibold text-foreground-muted">Messages reçus</h2>
        <div className="mt-3 space-y-2">
          {messages.length === 0 && <p className="text-sm text-foreground-muted">Rien pour le moment.</p>}
          {messages.map((m) => (
            <div key={m.id} className="carbon-panel rounded-xl p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium text-accent-strong">
                  {profileNames[m.from_profile_id] ?? "Quelqu'un"}
                </span>
                <span className="text-[11px] text-foreground-muted">{KIND_LABEL[m.kind]}</span>
              </div>
              <p className="mt-1 text-foreground-muted">{m.message}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
