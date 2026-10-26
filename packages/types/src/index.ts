/**
 * Row and response shapes of the REST API (/api/v1/notes, /tasks, /journal). They mirror the Zod row schemas in
 * apps/web/src/lib/api/resources.ts, which stay the source of truth: change them together.
 */
export type Tone = "violet" | "blue" | "green" | "amber" | "clay" | "sand" | "mint" | "gold";

export type Attachment = { path: string; name: string; type: string; size: number };

export type Task = {
  id: string;
  title: string;
  description: string;
  /** 1 (urgent) to 4 (none). */
  priority: 1 | 2 | 3 | 4;
  list_id: string | null;
  /** YYYY-MM-DD */
  due_date: string | null;
  done: boolean;
  done_at: string | null;
  cancelled: boolean;
  archived: boolean;
  recurrence: string | null;
  created_at: string;
};

export type Note = {
  id: string;
  title: string;
  body: string;
  category: string;
  pinned: boolean;
  kind: "text" | "voice";
  sort_order: number;
  color: Tone | null;
  attachments: Attachment[];
  created_at: string;
  updated_at: string;
};

export type JournalEntry = {
  id: string;
  /** YYYY-MM-DD */
  entry_date: string;
  body: string;
  kind: "text" | "voice";
  attachments: Attachment[];
  /** Set while the entry has a public link (32 hex characters); null when it is private. */
  share_token: string | null;
  created_at: string;
  updated_at: string;
};

/** What a person is allowed to do in a shared journal. The owner created it; editors write; viewers only read. */
export type SharedJournalRole = "owner" | "editor" | "viewer";
/** The role someone is invited as (the owner is never invited). */
export type SharedJournalInviteRole = Exclude<SharedJournalRole, "owner">;

/** The bit of a person other people may see: who they are, never their email. */
export type JournalPerson = { id: string; username: string | null; name: string; image: string | null };

/** A journal several people write in, as the signed-in person sees it. */
export type SharedJournal = {
  id: string;
  name: string;
  /** The signed-in person's role in it. */
  role: SharedJournalRole;
  owner: JournalPerson;
  member_count: number;
  entry_count: number;
  last_entry_at: string | null;
  created_at: string;
};

export type SharedJournalMember = { person: JournalPerson; role: SharedJournalRole; joined_at: string };

/** An invitation as the owner sees it (who was invited) or the invitee sees it (which journal, from whom). */
export type SharedJournalInvite = {
  id: string;
  journal_id: string;
  journal_name: string;
  role: SharedJournalInviteRole;
  invitee: JournalPerson;
  inviter: JournalPerson;
  created_at: string;
};

export type SharedJournalDetail = SharedJournal & {
  /** The signed-in person's own id, to tell which row in `members` is them. */
  me: string;
  members: SharedJournalMember[];
  /** Pending invitations; only the owner receives this list. */
  invites: SharedJournalInvite[];
};

export type SharedJournalEntry = Omit<JournalEntry, "share_token"> & { journal_id: string; author: JournalPerson };

/** A calendar event. Times are UTC timestamps; an all-day event runs from midnight to midnight in the owner's local time. */
export type CalendarEvent = {
  id: string;
  title: string;
  description: string;
  location: string;
  start_at: string;
  end_at: string;
  all_day: boolean;
  color: Tone | string;
};

/** One day of health aggregates synced from the phone (Apple Health or Health Connect). Any metric can be missing. */
export type HealthDay = {
  /** YYYY-MM-DD */
  day: string;
  steps: number | null;
  distance_m: number | null;
  active_kcal: number | null;
  resting_hr: number | null;
  hr_min: number | null;
  hr_max: number | null;
  sleep_minutes: number | null;
  source: "healthkit" | "health_connect" | "unknown";
  synced_at: string;
};

/** A feed the person follows (Workspace → Reader). `unread` is counted on the server. */
export type RssFeed = {
  id: string;
  url: string;
  site_url: string | null;
  title: string;
  description: string;
  image_url: string | null;
  last_fetched_at: string | null;
  last_error: string | null;
  created_at: string;
  unread: number;
};

/** One article, as plain text. `content` is only sent when a single article is opened. */
export type RssItem = {
  id: string;
  feed_id: string;
  feed_title: string;
  feed_image_url: string | null;
  title: string;
  link: string | null;
  summary: string;
  content?: string;
  image_url: string | null;
  author: string | null;
  published_at: string;
  is_read: boolean;
  is_starred: boolean;
};

export type RssFilter = "all" | "unread" | "starred";

export type ListResponse<T> = { data: T[]; limit: number; offset: number };
export type ItemResponse<T> = { data: T };

export type TaskList = { id: string; name: string; color: string; created_at: string };

export type PlanId = "subscription" | "payg" | "byo";

/** A plan on offer, as an admin has set it up. Prices are in the smallest unit of `currency` (paise for INR, so 74900 is ₹749). */
export type BillingPlan = {
  id: PlanId;
  name: string;
  tagline: string;
  price_cents: number;
  currency: string;
  interval: "month" | "year" | "none";
  /** Tokens included in each billing period (subscription); 0 means none. */
  included_tokens: number;
  /** What each million tokens cost on pay as you go, in the smallest unit of `currency`. */
  token_price_cents_per_million: number;
  features: string[];
  active: boolean;
  sort: number;
};

/** The signed-in person's plan, this period's AI use and their own-key setup. Never contains the key itself. */
export type MyBilling = {
  plans: BillingPlan[];
  plan: BillingPlan | null;
  status: "none" | "active" | "canceled";
  period_start: string | null;
  period_end: string | null;
  cancel_at_period_end: boolean;
  tokens_used: number;
  /** What this period's use costs on pay as you go, in the smallest unit of the plan's currency; 0 on other plans. */
  cost_cents: number;
  byo: { provider: string | null; model: string | null; hint: string | null };
  /** False until a payment provider is connected: plan changes are recorded but nobody is charged. */
  payments_connected: boolean;
};
