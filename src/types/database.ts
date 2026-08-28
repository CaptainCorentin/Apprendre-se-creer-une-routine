export type CheckinStatus = "done" | "missed" | "rest_assumed";

export type ContextTag = "streak_broken" | "milestone" | "rest_day" | "random" | null;

export interface Domain {
  id: string;
  name: string;
  icon: string;
  color: string;
  active: boolean;
  created_at: string;
}

export interface Checkin {
  id: string;
  domain_id: string;
  date: string; // YYYY-MM-DD
  status: CheckinStatus;
  created_at: string;
  updated_at: string;
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
