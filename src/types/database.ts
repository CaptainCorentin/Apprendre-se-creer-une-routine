export type CheckinStatus = "done" | "missed" | "rest_assumed";

export type ContextTag = "streak_broken" | "milestone" | "rest_day" | "random" | null;

export interface Domain {
  id: string;
  name: string;
  icon: string;
  color: string;
  active: boolean;
  created_at: string;
  /** Cible hebdomadaire (1-7). Null = suivi quotidien classique. */
  weekly_target: number | null;
  /** Objectif chiffré quotidien (ex: 2 "L", 20 "pages"). Null = pas d'objectif chiffré. */
  target_value: number | null;
  target_unit: string | null;
}

export interface Checkin {
  id: string;
  domain_id: string;
  date: string; // YYYY-MM-DD
  status: CheckinStatus;
  created_at: string;
  updated_at: string;
  duration_minutes: number | null;
  comment: string | null;
  value_achieved: number | null;
}

export interface WeeklyJournalEntry {
  id: string;
  week_start_date: string;
  went_well: string;
  got_stuck: string;
  pushed_through: string;
  process_learning: string;
  created_at: string;
}

export interface MonthlyJournalEntry {
  id: string;
  month_start_date: string;
  domain_trends: string;
  biggest_learning: string;
  next_month_intention: string;
  created_at: string;
}

export interface Idol {
  id: string;
  name: string;
  photo_url: string | null;
  display_order: number;
  created_at: string;
}

export interface IdolQuote {
  id: string;
  idol_id: string;
  quote_text: string;
  context_tag: ContextTag;
  created_at: string;
}

export interface IdolWithQuotes extends Idol {
  idol_quotes: IdolQuote[];
}

export type MessageKind = "encouragement" | "piquant";

export interface GroupMessage {
  id: string;
  from_profile_id: string;
  to_profile_id: string;
  week_start_date: string;
  kind: MessageKind;
  message: string;
  created_at: string;
  read_at: string | null;
}

export interface ProfileWeekSummary {
  profileId: string;
  profileName: string;
  profilePhotoUrl: string | null;
  acceptsPiquant: boolean;
  hasActivity: boolean;
  domains: {
    id: string;
    name: string;
    icon: string;
    color: string;
    done: number;
    target: number;
  }[];
}
