export type Task = { id: number; t: string; done: boolean; from?: string };
export type Msg = { who: string; text: string };
export type Mail = {
  id: number;
  from: string;
  subj: string;
  app: string;
  unread: boolean;
  starred: boolean;
  archived: boolean;
  msgs: Msg[];
};
export type Ev = { id: number; day: number; hour: number; t: string; tone: string };
export type Entry = { id: number; when: string; mood: string; text: string };
export type Rule = { id: string; t: string; s: string; on: boolean };
export type Version = { id: number; at: string; body: string };

export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
export const TODAY = 2; // Wednesday
export const HOURS = [9, 10, 11, 12, 13, 14, 15, 16];
export const MOODS = ["Focused", "Grateful", "Tired", "Excited", "Calm"];

export const NOTE_BODY =
  "Goal: ship the launch with pricing locked by Thursday.\n\nOwners: Maya (copy), Dev (checklist), Priya (pricing page).\nSee [[Q3 roadmap]] for scope and [[Launch review]] for the decision.\n\nOpen question: do we announce Pro limits (5 email accounts, 5 calendars) at launch?";

export const seedTasks = (): Task[] => [
  { id: 1, t: "Draft announcement", done: true },
  { id: 2, t: "Review pricing page with team", done: false },
  { id: 3, t: "Send recap to #launch on Slack", done: false },
];

export const seedMail = (): Mail[] => [
  {
    id: 1,
    from: "Maya",
    subj: "Re: Q3 roadmap review",
    app: "Gmail",
    unread: true,
    starred: false,
    archived: false,
    msgs: [
      { who: "Maya", text: "Shared the draft — thoughts on scope before the launch?" },
      { who: "You", text: "Looks good. Attaching the revised timeline." },
      { who: "Maya", text: "Great, can you confirm owners for the pricing page?" },
    ],
  },
  {
    id: 2,
    from: "Dev",
    subj: "Launch checklist",
    app: "Gmail",
    unread: true,
    starred: false,
    archived: false,
    msgs: [{ who: "Dev", text: "Can we move the review to Thursday? The checklist is nearly done." }],
  },
  {
    id: 3,
    from: "Priya",
    subj: "Pricing page copy",
    app: "Gmail",
    unread: false,
    starred: true,
    archived: false,
    msgs: [{ who: "Priya", text: "Attached the revised copy for sign-off. Two small edits in the FAQ." }],
  },
];

export const seedEvents = (): Ev[] => [
  { id: 1, day: 0, hour: 10, t: "Planning", tone: "green" },
  { id: 2, day: 1, hour: 13, t: "1:1 with Sam", tone: "amber" },
  { id: 3, day: 2, hour: 9, t: "Stand-up", tone: "green" },
  { id: 4, day: 2, hour: 11, t: "Launch review", tone: "violet" },
  { id: 5, day: 2, hour: 16, t: "Dentist", tone: "clay" },
  { id: 6, day: 3, hour: 14, t: "Pricing sign-off", tone: "amber" },
  { id: 7, day: 4, hour: 12, t: "Team lunch", tone: "clay" },
];

export const seedEntries = (): Entry[] => [
  {
    id: 1,
    when: "Yesterday",
    mood: "Focused",
    text: "Shipped the first draft of the launch plan. The pricing discussion unblocked everyone.",
  },
];

export const seedRules = (): Rule[] => [
  { id: "recap", t: "Post meeting recap to Slack", s: "When a meeting ends", on: true },
  { id: "actions", t: "Add meeting action items to my to-do", s: "When a meeting ends", on: true },
  { id: "digest", t: "Send me a Daily Brief", s: "Every weekday at 8:00", on: false },
];

export const TRANSCRIPT = [
  "Maya: Thanks everyone — let’s start with pricing.",
  "Dev: The checklist is ready; only the FAQ is open.",
  "Priya: I can have the pricing page copy signed off by Thursday.",
  "Maya: Great. Let’s lock the Pro limits and send a recap today.",
];
export const ACTIONS = ["Lock Pro limits in the pricing page", "Send launch recap to the team"];

export const STEPS: { id: string; t: string; view: string }[] = [
  { id: "search", t: "Search everything with ⌘K", view: "home" },
  { id: "task", t: "Add and complete a task", view: "todo" },
  { id: "note", t: "Save a version of your note", view: "notes" },
  { id: "reply", t: "Reply to an email", view: "email" },
  { id: "event", t: "Add an event to your calendar", view: "calendar" },
  { id: "meeting", t: "Record a meeting", view: "meetings" },
  { id: "rule", t: "Flip or run an automation", view: "automations" },
  { id: "ai", t: "Turn AI off — everything still works", view: "home" },
];
