"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { fetchIdolsWithQuotes } from "@/lib/data";
import type { IdolWithQuotes } from "@/types/database";

const SILHOUETTE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#1c1c1f"/><circle cx="50" cy="36" r="18" fill="#3a3a3f"/><path d="M50 58c-22 0-34 14-34 30v6h68v-6c0-16-12-30-34-30z" fill="#3a3a3f"/></svg>`
  );

export default function HallOfFamePage() {
  const [idols, setIdols] = useState<IdolWithQuotes[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIdolsWithQuotes()
      .then(setIdols)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-md px-4 pt-8">
      <h1 className="text-xl font-bold tracking-tight">Hall of Fame</h1>
      <p className="mt-1 text-sm text-foreground-muted">
        Les figures qui inspirent ta discipline.
      </p>

      {loading && <p className="mt-6 text-sm text-foreground-muted">Chargement…</p>}

      <div className="mt-6 space-y-4">
        {idols.map((idol) => (
          <div key={idol.id} className="carbon-panel rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-accent">
                <Image
                  src={idol.photo_url || SILHOUETTE}
                  alt={idol.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <h2 className="text-lg font-semibold">{idol.name}</h2>
            </div>
            <div className="mt-4 space-y-2">
              {idol.idol_quotes.length === 0 && (
                <p className="text-xs text-foreground-muted">Aucune citation pour le moment.</p>
              )}
              {idol.idol_quotes.map((quote) => (
                <p key={quote.id} className="rounded-lg bg-surface-raised px-3 py-2 text-sm text-foreground">
                  « {quote.quote_text} »
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
