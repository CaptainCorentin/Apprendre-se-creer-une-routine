import { supabase } from "./supabase";
import type {
  Checkin,
  CheckinStatus,
  Domain,
  IdolWithQuotes,
  IdolQuote,
  MonthlyJournalEntry,
  WeeklyJournalEntry,
  ContextTag,
} from "@/types/database";
import { addDays, getEffectiveDate, toDateKey } from "./date";

// ============================================================
// Domains
// ============================================================

export async function fetchDomains(): Promise<Domain[]> {
  const { data, error } = await supabase
    .from("domains")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchActiveDomains(): Promise<Domain[]> {
  const { data, error } = await supabase
    .from("domains")
    .select("*")
    .eq("active", true)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createDomain(input: {
  name: string;
  icon: string;
  color: string;
  weekly_target?: number | null;
}): Promise<Domain> {
  const { data, error } = await supabase
    .from("domains")
    .insert({
      name: input.name,
      icon: input.icon,
      color: input.color,
      weekly_target: input.weekly_target ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateDomain(
  id: string,
  updates: Partial<Pick<Domain, "name" | "icon" | "color" | "active" | "weekly_target">>
): Promise<Domain> {
  const { data, error } = await supabase
    .from("domains")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ============================================================
// Checkins
// ============================================================

export async function fetchCheckinsForDomain(domainId: string): Promise<Checkin[]> {
  const { data, error } = await supabase
    .from("checkins")
    .select("*")
    .eq("domain_id", domainId)
    .order("date", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchCheckinsSince(domainId: string, sinceDateKey: string): Promise<Checkin[]> {
  const { data, error } = await supabase
    .from("checkins")
    .select("*")
    .eq("domain_id", domainId)
    .gte("date", sinceDateKey)
    .order("date", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchAllCheckins(): Promise<Checkin[]> {
  const { data, error } = await supabase.from("checkins").select("*").order("date", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/** Récupère les checkins de plusieurs domaines sur une plage de dates (bornes incluses). */
export async function fetchCheckinsInRange(
  domainIds: string[],
  startDateKey: string,
  endDateKey: string
): Promise<Checkin[]> {
  if (domainIds.length === 0) return [];
  const { data, error } = await supabase
    .from("checkins")
    .select("*")
    .in("domain_id", domainIds)
    .gte("date", startDateKey)
    .lte("date", endDateKey)
    .order("date", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function upsertCheckin(
  domainId: string,
  dateKey: string,
  status: CheckinStatus,
  details?: { duration_minutes?: number | null; comment?: string | null }
): Promise<Checkin> {
  const { data, error } = await supabase
    .from("checkins")
    .upsert(
      {
        domain_id: domainId,
        date: dateKey,
        status,
        duration_minutes: details?.duration_minutes ?? null,
        comment: details?.comment ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "domain_id,date" }
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Supprime le checkin d'un domaine à une date donnée (untoggle pour les domaines à cible hebdo). */
export async function deleteCheckin(domainId: string, dateKey: string): Promise<void> {
  const { error } = await supabase.from("checkins").delete().eq("domain_id", domainId).eq("date", dateKey);
  if (error) throw error;
}

/**
 * Marque rétroactivement comme "missed" tous les jours effectifs passés sans
 * checkin pour un domaine actif quotidien, depuis sa création (ou son dernier
 * checkin connu) jusqu'à hier (le jour effectif courant n'est jamais auto-marqué).
 *
 * Les domaines à cible hebdomadaire (`weekly_target` défini) ne sont jamais
 * auto-marqués : un jour sans checkin y est normal, seule la cible de la
 * semaine compte.
 */
export async function backfillMissedCheckins(domains: Domain[]): Promise<void> {
  const todayKey = toDateKey(getEffectiveDate());

  for (const domain of domains) {
    if (!domain.active || domain.weekly_target) continue;

    const existing = await fetchCheckinsForDomain(domain.id);
    const existingDates = new Set(existing.map((c) => c.date));

    const mostRecentKey = existing.length > 0 ? existing[0].date : null;
    const creationDate = new Date(domain.created_at);
    const startDate = mostRecentKey
      ? addDays(new Date(mostRecentKey), 1)
      : new Date(creationDate.getFullYear(), creationDate.getMonth(), creationDate.getDate());

    const missingKeys: string[] = [];
    let cursor = startDate;
    while (toDateKey(cursor) < todayKey) {
      const key = toDateKey(cursor);
      if (!existingDates.has(key)) {
        missingKeys.push(key);
      }
      cursor = addDays(cursor, 1);
    }

    if (missingKeys.length === 0) continue;

    const rows = missingKeys.map((date) => ({
      domain_id: domain.id,
      date,
      status: "missed" as CheckinStatus,
    }));

    const { error } = await supabase.from("checkins").upsert(rows, { onConflict: "domain_id,date" });
    if (error) throw error;
  }
}

// ============================================================
// Weekly journal
// ============================================================

export async function fetchWeeklyEntry(weekStartKey: string): Promise<WeeklyJournalEntry | null> {
  const { data, error } = await supabase
    .from("weekly_journal_entries")
    .select("*")
    .eq("week_start_date", weekStartKey)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchAllWeeklyEntries(): Promise<WeeklyJournalEntry[]> {
  const { data, error } = await supabase
    .from("weekly_journal_entries")
    .select("*")
    .order("week_start_date", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function upsertWeeklyEntry(
  weekStartKey: string,
  fields: Pick<WeeklyJournalEntry, "went_well" | "got_stuck" | "pushed_through" | "process_learning">
): Promise<WeeklyJournalEntry> {
  const { data, error } = await supabase
    .from("weekly_journal_entries")
    .upsert({ week_start_date: weekStartKey, ...fields }, { onConflict: "week_start_date" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ============================================================
// Monthly journal
// ============================================================

export async function fetchMonthlyEntry(monthStartKey: string): Promise<MonthlyJournalEntry | null> {
  const { data, error } = await supabase
    .from("monthly_journal_entries")
    .select("*")
    .eq("month_start_date", monthStartKey)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchAllMonthlyEntries(): Promise<MonthlyJournalEntry[]> {
  const { data, error } = await supabase
    .from("monthly_journal_entries")
    .select("*")
    .order("month_start_date", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function upsertMonthlyEntry(
  monthStartKey: string,
  fields: Pick<MonthlyJournalEntry, "domain_trends" | "biggest_learning" | "next_month_intention">
): Promise<MonthlyJournalEntry> {
  const { data, error } = await supabase
    .from("monthly_journal_entries")
    .upsert({ month_start_date: monthStartKey, ...fields }, { onConflict: "month_start_date" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchWeeklyEntriesInMonth(monthStartKey: string): Promise<WeeklyJournalEntry[]> {
  const start = new Date(monthStartKey);
  const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
  const { data, error } = await supabase
    .from("weekly_journal_entries")
    .select("*")
    .gte("week_start_date", monthStartKey)
    .lt("week_start_date", toDateKey(end))
    .order("week_start_date", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

// ============================================================
// Idols & quotes
// ============================================================

export async function fetchIdolsWithQuotes(): Promise<IdolWithQuotes[]> {
  const { data, error } = await supabase
    .from("idols")
    .select("*, idol_quotes(*)")
    .order("display_order", { ascending: true });
  if (error) throw error;
  return (data as IdolWithQuotes[]) ?? [];
}

export async function createIdol(input: { name: string; photo_url?: string | null }) {
  const { data: existing } = await supabase
    .from("idols")
    .select("display_order")
    .order("display_order", { ascending: false })
    .limit(1);
  const nextOrder = existing && existing.length > 0 ? existing[0].display_order + 1 : 0;

  const { data, error } = await supabase
    .from("idols")
    .insert({ name: input.name, photo_url: input.photo_url ?? null, display_order: nextOrder })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateIdol(
  id: string,
  updates: Partial<{ name: string; photo_url: string | null; display_order: number }>
) {
  const { data, error } = await supabase.from("idols").update(updates).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function createIdolQuote(input: {
  idol_id: string;
  quote_text: string;
  context_tag: ContextTag;
}): Promise<IdolQuote> {
  const { data, error } = await supabase
    .from("idol_quotes")
    .insert({
      idol_id: input.idol_id,
      quote_text: input.quote_text,
      context_tag: input.context_tag,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateIdolQuote(
  id: string,
  updates: Partial<{ quote_text: string; context_tag: ContextTag }>
): Promise<IdolQuote> {
  const { data, error } = await supabase.from("idol_quotes").update(updates).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteIdolQuote(id: string): Promise<void> {
  const { error } = await supabase.from("idol_quotes").delete().eq("id", id);
  if (error) throw error;
}

export async function uploadIdolPhoto(idolId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${idolId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("idol-photos").upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from("idol-photos").getPublicUrl(path);
  return data.publicUrl;
}
