"use client";

import { useEffect, useRef, useState } from "react";
import { useAppContext } from "@/components/AppProvider";
import { DomainCard } from "@/components/DomainCard";
import { MotivationModal } from "@/components/MotivationModal";
import type { CheckinEdit } from "@/components/CatchupRow";
import type { Checkin, CheckinStatus, ContextTag, IdolWithQuotes } from "@/types/database";
import { deleteCheckin, fetchAllCheckins, fetchIdolsWithQuotes, upsertCheckin } from "@/lib/data";
import { calculateStreak, calculateWeeklyStreak, getMilestoneReached, getWeeklyMilestoneReached } from "@/lib/streaks";
import { getEffectiveDateKey } from "@/lib/date";
import {
  hasRolledRandomPopupToday,
  markRandomPopupRolledToday,
  pickQuoteForTag,
  rollRandomPopupChance,
  type QuoteWithIdol,
} from "@/lib/motivation";

const KEY_MOMENT_FLAG = "routine:key-moment-shown-date";

function todayFlag() {
  return new Date().toISOString().slice(0, 10);
}

export default function TodayPage() {
  const { profileId, activeDomains, ready } = useAppContext();
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [idols, setIdols] = useState<IdolWithQuotes[]>([]);
  const [loading, setLoading] = useState(true);
  const [popup, setPopup] = useState<QuoteWithIdol | null>(null);
  const randomTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!ready || !profileId) return;
    let cancelled = false;
    Promise.all([fetchAllCheckins(profileId), fetchIdolsWithQuotes(profileId)]).then(
      ([checkinsData, idolsData]) => {
        if (cancelled) return;
        setCheckins(checkinsData);
        setIdols(idolsData);
        setLoading(false);
      }
    );
    return () => {
      cancelled = true;
    };
  }, [ready, profileId]);

  // Pop-up aléatoire : une chance par jour maximum, ne se cumule pas avec un moment clé.
  useEffect(() => {
    if (!ready || loading || idols.length === 0) return;
    if (hasRolledRandomPopupToday()) return;

    markRandomPopupRolledToday();
    if (!rollRandomPopupChance()) return;

    randomTimer.current = setTimeout(() => {
      if (typeof window !== "undefined" && window.localStorage.getItem(KEY_MOMENT_FLAG) === todayFlag()) {
        return;
      }
      const quote = pickQuoteForTag(idols, "random");
      if (quote) setPopup(quote);
    }, 3500);

    return () => {
      if (randomTimer.current) clearTimeout(randomTimer.current);
    };
  }, [ready, loading, idols]);

  function showKeyMomentPopup(tag: ContextTag) {
    if (randomTimer.current) clearTimeout(randomTimer.current);
    if (typeof window !== "undefined") window.localStorage.setItem(KEY_MOMENT_FLAG, todayFlag());
    const quote = pickQuoteForTag(idols, tag);
    if (quote) setPopup(quote);
  }

  async function handleCheckin(
    domainId: string,
    dateKey: string,
    status: CheckinStatus | "none",
    details?: CheckinEdit
  ) {
    if (!profileId) return;
    const domain = activeDomains.find((d) => d.id === domainId);
    const domainCheckins = checkins.filter((c) => c.domain_id === domainId);
    const isToday = dateKey === getEffectiveDateKey();
    const existing = domainCheckins.find((c) => c.date === dateKey);

    if (status === "none") {
      await deleteCheckin(domainId, dateKey);
      setCheckins((prev) => prev.filter((c) => !(c.domain_id === domainId && c.date === dateKey)));
      return;
    }

    const saved = await upsertCheckin(profileId, domainId, dateKey, status, {
      duration_minutes: details?.duration_minutes ?? existing?.duration_minutes ?? null,
      comment: details?.comment ?? existing?.comment ?? null,
    });
    setCheckins((prev) => {
      const withoutOld = prev.filter((c) => !(c.domain_id === domainId && c.date === dateKey));
      return [...withoutOld, saved];
    });

    // Les moments clés (streak cassé / palier / repos) ne se déclenchent que
    // pour une action sur le jour effectif courant, pas pour un rattrapage.
    if (!isToday || !domain) return;

    const updatedDomainCheckins = [...domainCheckins.filter((c) => c.date !== dateKey), saved];

    if (domain.weekly_target) {
      const previous = calculateWeeklyStreak(domainCheckins, domain.weekly_target);
      const updated = calculateWeeklyStreak(updatedDomainCheckins, domain.weekly_target);
      if (status === "missed") {
        showKeyMomentPopup("streak_broken");
      } else if (status === "rest_assumed") {
        showKeyMomentPopup("rest_day");
      } else if (status === "done" && updated.streak > previous.streak && getWeeklyMilestoneReached(updated.streak)) {
        showKeyMomentPopup("milestone");
      }
    } else {
      const previousStreak = calculateStreak(domainCheckins);
      const newStreak = calculateStreak(updatedDomainCheckins);
      if (status === "missed" && previousStreak > 0) {
        showKeyMomentPopup("streak_broken");
      } else if (status === "rest_assumed") {
        showKeyMomentPopup("rest_day");
      } else if (status === "done" && getMilestoneReached(newStreak)) {
        showKeyMomentPopup("milestone");
      }
    }
  }

  if (!ready || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-foreground-muted">
        Chargement…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 pt-8">
      <h1 className="text-xl font-bold tracking-tight">Aujourd&apos;hui</h1>
      <p className="mt-1 text-sm text-foreground-muted">
        {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
      </p>

      <div className="mt-6 space-y-4">
        {activeDomains.length === 0 && (
          <p className="text-sm text-foreground-muted">
            Aucun domaine actif. Ajoute-en un dans les réglages.
          </p>
        )}
        {activeDomains.map((domain) => (
          <DomainCard
            key={domain.id}
            domain={domain}
            checkins={checkins.filter((c) => c.domain_id === domain.id)}
            onCheckin={handleCheckin}
          />
        ))}
      </div>

      {popup && <MotivationModal quoteWithIdol={popup} onClose={() => setPopup(null)} />}
    </div>
  );
}
