"use client";

import { useState } from "react";
import { sendGroupMessage } from "@/lib/groupMessages";
import type { MessageKind } from "@/types/database";

interface Props {
  fromProfileId: string;
  target: { profileId: string; name: string; acceptsPiquant: boolean };
  weekStartKey: string;
  onSent: () => void;
  onCancel: () => void;
}

export function MessageComposer({ fromProfileId, target, weekStartKey, onSent, onCancel }: Props) {
  const [kind, setKind] = useState<MessageKind>("encouragement");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSend() {
    if (!text.trim()) return;
    setSending(true);
    setError(null);
    try {
      await sendGroupMessage({
        fromProfileId,
        toProfileId: target.profileId,
        weekStartKey,
        kind,
        message: text.trim(),
      });
      onSent();
    } catch (err) {
      setError("Ce profil n'accepte pas les piques. Essaie un encouragement.");
      console.error(err);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="modal-in carbon-panel w-full max-w-sm rounded-2xl p-5">
      <p className="text-sm font-semibold">À {target.name}</p>
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => setKind("encouragement")}
          className={`flex-1 rounded-lg py-2 text-xs font-medium transition ${
            kind === "encouragement" ? "bg-accent text-white" : "bg-surface-raised text-foreground-muted"
          }`}
        >
          👏 Encouragement
        </button>
        {target.acceptsPiquant && (
          <button
            onClick={() => setKind("piquant")}
            className={`flex-1 rounded-lg py-2 text-xs font-medium transition ${
              kind === "piquant" ? "bg-accent text-white" : "bg-surface-raised text-foreground-muted"
            }`}
          >
            😈 Pique
          </button>
        )}
      </div>
      {!target.acceptsPiquant && (
        <p className="mt-1 text-[11px] text-foreground-muted">{target.name} n&apos;accepte que les encouragements.</p>
      )}
      {error && <p className="mt-2 text-xs text-accent-strong">{error}</p>}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Ton message…"
        rows={3}
        autoFocus
        className="mt-3 w-full rounded-lg border border-border-subtle bg-surface-raised px-3 py-2 text-sm outline-none focus:border-accent"
      />
      <div className="mt-3 flex gap-2">
        <button
          onClick={handleSend}
          disabled={sending || !text.trim()}
          className="flex-1 rounded-xl bg-accent py-2.5 text-sm font-semibold text-white hover:bg-accent-strong disabled:opacity-50"
        >
          {sending ? "Envoi…" : "Envoyer"}
        </button>
        <button
          onClick={onCancel}
          className="rounded-xl border border-border-subtle px-4 py-2.5 text-sm text-foreground-muted"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}
