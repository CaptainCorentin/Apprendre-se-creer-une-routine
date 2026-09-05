"use client";

import { useState } from "react";
import Link from "next/link";
import { useAppContext } from "./AppProvider";

export function NotificationCenter() {
  const { ready, profileId, domains, missingCheckinsCount, journalDue, unreadMessages } = useAppContext();
  const [open, setOpen] = useState(false);

  if (!ready || !profileId || domains.length === 0) return null;

  const total = missingCheckinsCount + (journalDue ? 1 : 0) + unreadMessages;

  return (
    <div className="fixed right-3 top-3 z-40">
      <button
        onClick={() => setOpen((v) => !v)}
        className="carbon-panel relative flex h-10 w-10 items-center justify-center rounded-full text-lg"
        aria-label="Notifications"
      >
        🔔
        {total > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-strong px-1 text-[10px] font-semibold text-white">
            {total}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            aria-label="Fermer"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />
          <div className="modal-in carbon-panel absolute right-0 top-12 z-50 w-64 space-y-1 rounded-xl p-2">
            {total === 0 && <p className="p-2 text-xs text-foreground-muted">Rien à signaler 👌</p>}

            {missingCheckinsCount > 0 && (
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className="block rounded-lg p-2 text-xs hover:bg-surface-raised"
              >
                🔥 {missingCheckinsCount} domaine{missingCheckinsCount > 1 ? "s" : ""} sans check-in aujourd&apos;hui
              </Link>
            )}
            {journalDue && (
              <Link
                href="/journal"
                onClick={() => setOpen(false)}
                className="block rounded-lg p-2 text-xs hover:bg-surface-raised"
              >
                📓 Journal à remplir
              </Link>
            )}
            {unreadMessages > 0 && (
              <Link
                href="/entre-nous"
                onClick={() => setOpen(false)}
                className="block rounded-lg p-2 text-xs hover:bg-surface-raised"
              >
                🤝 {unreadMessages} message{unreadMessages > 1 ? "s" : ""} reçu{unreadMessages > 1 ? "s" : ""}
              </Link>
            )}
          </div>
        </>
      )}
    </div>
  );
}
