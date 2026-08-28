"use client";

import Image from "next/image";
import type { QuoteWithIdol } from "@/lib/motivation";

const SILHOUETTE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#1c1c1f"/><circle cx="50" cy="36" r="18" fill="#3a3a3f"/><path d="M50 58c-22 0-34 14-34 30v6h68v-6c0-16-12-30-34-30z" fill="#3a3a3f"/></svg>`
  );

interface Props {
  quoteWithIdol: QuoteWithIdol;
  onClose: () => void;
}

export function MotivationModal({ quoteWithIdol, onClose }: Props) {
  const { quote, idol } = quoteWithIdol;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
      onClick={onClose}
    >
      <div
        className="modal-in carbon-panel w-full max-w-sm rounded-2xl p-5 shadow-2xl shadow-black/60"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-accent">
            <Image
              src={idol.photo_url || SILHOUETTE}
              alt={idol.name}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          <div>
            <p className="text-sm font-semibold text-accent-strong">{idol.name}</p>
          </div>
        </div>
        <p className="mt-4 text-lg leading-relaxed text-foreground">« {quote.quote_text} »</p>
        <button
          onClick={onClose}
          className="mt-5 w-full rounded-xl bg-accent py-2.5 text-sm font-semibold text-white transition hover:bg-accent-strong"
        >
          Fermer
        </button>
      </div>
    </div>
  );
}
