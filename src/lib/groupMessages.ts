import { supabase } from "./supabase";
import { listProfiles } from "./profiles";
import { fetchActiveDomains, fetchCheckinsInRange } from "./data";
import type { GroupMessage, MessageKind, ProfileWeekSummary } from "@/types/database";
import { addDays, fromDateKey, toDateKey } from "./date";

/** Résumé hebdo de tous les profils (pour l'espace "Entre nous") : pas de détail quotidien. */
export async function fetchWeeklySummaries(weekStartKey: string): Promise<ProfileWeekSummary[]> {
  const profiles = await listProfiles();
  const weekEndKey = toDateKey(addDays(fromDateKey(weekStartKey), 6));

  const summaries: ProfileWeekSummary[] = [];
  for (const profile of profiles) {
    const domains = await fetchActiveDomains(profile.id);
    const domainIds = domains.map((d) => d.id);
    const checkins = domainIds.length > 0 ? await fetchCheckinsInRange(domainIds, weekStartKey, weekEndKey) : [];

    const doneByDomain = new Map<string, number>();
    for (const c of checkins) {
      if (c.status !== "done") continue;
      doneByDomain.set(c.domain_id, (doneByDomain.get(c.domain_id) ?? 0) + 1);
    }

    summaries.push({
      profileId: profile.id,
      profileName: profile.name,
      domains: domains.map((d) => ({
        id: d.id,
        name: d.name,
        icon: d.icon,
        color: d.color,
        done: doneByDomain.get(d.id) ?? 0,
        target: d.weekly_target ?? 7,
      })),
    });
  }
  return summaries;
}

export async function sendGroupMessage(input: {
  fromProfileId: string;
  toProfileId: string;
  weekStartKey: string;
  kind: MessageKind;
  message: string;
}): Promise<GroupMessage> {
  const { data, error } = await supabase
    .from("group_messages")
    .insert({
      from_profile_id: input.fromProfileId,
      to_profile_id: input.toProfileId,
      week_start_date: input.weekStartKey,
      kind: input.kind,
      message: input.message,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchReceivedMessages(profileId: string): Promise<GroupMessage[]> {
  const { data, error } = await supabase
    .from("group_messages")
    .select("*")
    .eq("to_profile_id", profileId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function countUnreadMessages(profileId: string): Promise<number> {
  const { count, error } = await supabase
    .from("group_messages")
    .select("*", { count: "exact", head: true })
    .eq("to_profile_id", profileId)
    .is("read_at", null);
  if (error) throw error;
  return count ?? 0;
}

export async function markMessagesRead(profileId: string): Promise<void> {
  const { error } = await supabase
    .from("group_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("to_profile_id", profileId)
    .is("read_at", null);
  if (error) throw error;
}
