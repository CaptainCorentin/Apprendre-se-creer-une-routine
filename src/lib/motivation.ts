import type { ContextTag, IdolWithQuotes, IdolQuote } from "@/types/database";
import { getEffectiveDateKey } from "./date";

export interface QuoteWithIdol {
  quote: IdolQuote;
  idol: IdolWithQuotes;
}

function pickRandom<T>(arr: T[]): T | null {
  if (arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Tire une citation pour un tag donné. Si aucune citation ne correspond,
 * retombe sur une citation aléatoire toutes idoles confondues.
 */
export function pickQuoteForTag(idols: IdolWithQuotes[], tag: ContextTag): QuoteWithIdol | null {
  const matches: QuoteWithIdol[] = [];
  for (const idol of idols) {
    for (const quote of idol.idol_quotes) {
      if (quote.context_tag === tag) {
        matches.push({ quote, idol });
      }
    }
  }

  const pool = matches.length > 0 ? matches : allQuotes(idols);
  return pickRandom(pool);
}

function allQuotes(idols: IdolWithQuotes[]): QuoteWithIdol[] {
  const pool: QuoteWithIdol[] = [];
  for (const idol of idols) {
    for (const quote of idol.idol_quotes) {
      pool.push({ quote, idol });
    }
  }
  return pool;
}

const RANDOM_POPUP_KEY = "routine:last-random-popup-date";

/** Une chance par jour maximum pour le pop-up aléatoire (pas par session). */
export function hasRolledRandomPopupToday(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(RANDOM_POPUP_KEY) === getEffectiveDateKey();
}

export function markRandomPopupRolledToday(): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(RANDOM_POPUP_KEY, getEffectiveDateKey());
}

/** Tire au sort si le pop-up aléatoire du jour se déclenche (à appeler une fois par jour). */
export function rollRandomPopupChance(probability = 1 / 3): boolean {
  return Math.random() < probability;
}
