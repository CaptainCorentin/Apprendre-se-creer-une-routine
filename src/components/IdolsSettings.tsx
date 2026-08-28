"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  createIdol,
  createIdolQuote,
  deleteIdolQuote,
  fetchIdolsWithQuotes,
  updateIdol,
  updateIdolQuote,
  uploadIdolPhoto,
} from "@/lib/data";
import type { ContextTag, IdolWithQuotes } from "@/types/database";
import { useAppContext } from "./AppProvider";

const SILHOUETTE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#1c1c1f"/><circle cx="50" cy="36" r="18" fill="#3a3a3f"/><path d="M50 58c-22 0-34 14-34 30v6h68v-6c0-16-12-30-34-30z" fill="#3a3a3f"/></svg>`
  );

const TAG_LABELS: Record<Exclude<ContextTag, null>, string> = {
  streak_broken: "Streak cassé",
  milestone: "Palier atteint",
  rest_day: "Repos assumé",
  random: "Aléatoire",
};

export function IdolsSettings() {
  const { profileId } = useAppContext();
  const [idols, setIdols] = useState<IdolWithQuotes[]>([]);
  const [newIdolName, setNewIdolName] = useState("");
  const [busyIdolId, setBusyIdolId] = useState<string | null>(null);
  const [quoteDrafts, setQuoteDrafts] = useState<Record<string, { text: string; tag: ContextTag }>>({});

  async function refresh() {
    if (!profileId) return;
    setIdols(await fetchIdolsWithQuotes(profileId));
  }

  useEffect(() => {
    if (!profileId) return;
    fetchIdolsWithQuotes(profileId).then(setIdols);
  }, [profileId]);

  async function handleAddIdol(e: React.FormEvent) {
    e.preventDefault();
    if (!newIdolName.trim() || !profileId) return;
    await createIdol({ profileId, name: newIdolName.trim() });
    setNewIdolName("");
    await refresh();
  }

  async function handlePhotoChange(idolId: string, file: File | null) {
    if (!file) return;
    setBusyIdolId(idolId);
    try {
      const photoUrl = await uploadIdolPhoto(idolId, file);
      await updateIdol(idolId, { photo_url: photoUrl });
      await refresh();
    } finally {
      setBusyIdolId(null);
    }
  }

  async function handleAddQuote(idolId: string) {
    const draft = quoteDrafts[idolId];
    if (!draft || !draft.text.trim()) return;
    await createIdolQuote({ idol_id: idolId, quote_text: draft.text.trim(), context_tag: draft.tag });
    setQuoteDrafts((prev) => ({ ...prev, [idolId]: { text: "", tag: null } }));
    await refresh();
  }

  async function handleQuoteTagChange(quoteId: string, tag: ContextTag) {
    await updateIdolQuote(quoteId, { context_tag: tag });
    await refresh();
  }

  async function handleDeleteQuote(quoteId: string) {
    await deleteIdolQuote(quoteId);
    await refresh();
  }

  return (
    <section className="mt-8">
      <h2 className="text-sm font-semibold text-foreground-muted">Idoles</h2>

      <div className="mt-3 space-y-4">
        {idols.map((idol) => {
          const draft = quoteDrafts[idol.id] ?? { text: "", tag: null };
          return (
            <div key={idol.id} className="carbon-panel rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border-2 border-accent">
                  <Image
                    src={idol.photo_url || SILHOUETTE}
                    alt={idol.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{idol.name}</p>
                  <label className="mt-1 inline-block cursor-pointer text-xs text-accent-strong">
                    {busyIdolId === idol.id ? "Envoi…" : "Changer la photo"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handlePhotoChange(idol.id, e.target.files?.[0] ?? null)}
                    />
                  </label>
                </div>
              </div>

              <div className="mt-3 space-y-2">
                {idol.idol_quotes.map((quote) => (
                  <div key={quote.id} className="rounded-lg bg-surface-raised p-2">
                    <p className="text-sm">« {quote.quote_text} »</p>
                    <div className="mt-1 flex items-center justify-between">
                      <select
                        value={quote.context_tag ?? ""}
                        onChange={(e) =>
                          handleQuoteTagChange(quote.id, (e.target.value || null) as ContextTag)
                        }
                        className="rounded border border-border-subtle bg-surface px-1.5 py-1 text-[11px]"
                      >
                        <option value="">Sans tag</option>
                        {Object.entries(TAG_LABELS).map(([tag, label]) => (
                          <option key={tag} value={tag}>
                            {label}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleDeleteQuote(quote.id)}
                        className="text-[11px] text-foreground-muted hover:text-accent-strong"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex flex-col gap-2">
                <textarea
                  value={draft.text}
                  onChange={(e) =>
                    setQuoteDrafts((prev) => ({ ...prev, [idol.id]: { ...draft, text: e.target.value } }))
                  }
                  placeholder="Nouvelle citation…"
                  rows={2}
                  className="rounded-lg border border-border-subtle bg-surface-raised px-2 py-1.5 text-sm outline-none focus:border-accent"
                />
                <div className="flex items-center gap-2">
                  <select
                    value={draft.tag ?? ""}
                    onChange={(e) =>
                      setQuoteDrafts((prev) => ({
                        ...prev,
                        [idol.id]: { ...draft, tag: (e.target.value || null) as ContextTag },
                      }))
                    }
                    className="rounded border border-border-subtle bg-surface px-1.5 py-1 text-[11px]"
                  >
                    <option value="">Sans tag</option>
                    {Object.entries(TAG_LABELS).map(([tag, label]) => (
                      <option key={tag} value={tag}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleAddQuote(idol.id)}
                    className="flex-1 rounded-lg bg-accent py-1.5 text-xs font-semibold text-white hover:bg-accent-strong"
                  >
                    Ajouter la citation
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={handleAddIdol} className="carbon-panel mt-4 rounded-xl p-3">
        <p className="mb-2 text-xs font-medium text-foreground-muted">Ajouter une idole</p>
        <div className="flex gap-2">
          <input
            value={newIdolName}
            onChange={(e) => setNewIdolName(e.target.value)}
            placeholder="Nom de l'idole"
            className="flex-1 rounded-lg border border-border-subtle bg-surface-raised px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <button
            type="submit"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-strong"
          >
            Ajouter
          </button>
        </div>
      </form>
    </section>
  );
}
