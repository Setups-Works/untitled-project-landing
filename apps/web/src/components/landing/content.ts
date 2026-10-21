import {
  faBookOpen,
  faCalendarDays,
  faClockRotateLeft,
  faComments,
  faEnvelope,
  faFileExport,
  faFingerprint,
  faKey,
  faPaperclip,
  faListCheck,
  faLock,
  faMagnifyingGlass,
  faMicrophone,
  faPenToSquare,
  faRoute,
  faShareNodes,
  faShieldHalved,
  faTableColumns,
  faUserGroup,
  faUserLock,
  faWandMagicSparkles,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import type { Status } from "./Kit";
import type { Tone } from "../../lib/tones";

/**
 * Landing-page copy that makes factual claims about the product. Every `status` here must match docs/CURRENT_STATE.md —
 * "live" only for what ships today. When something ships, flip its status; don't reword the claim.
 */

export type Capability = { icon: IconDefinition; t: string; d: string; tone: Tone; status: Status };

export const CAPABILITIES: Capability[] = [
  {
    icon: faPenToSquare,
    t: "Notes",
    d: "Rich notes with colours, slash commands, voice, attachments and version history.",
    tone: "blue",
    status: "live",
  },
  { icon: faListCheck, t: "Tasks", d: "Lists, priorities, repeats, and list, board or calendar views.", tone: "amber", status: "live" },
  { icon: faBookOpen, t: "Journal", d: "Many entries a day, private to you, with voice and attachments.", tone: "violet", status: "live" },
  {
    icon: faCalendarDays,
    t: "Calendar",
    d: "Month, week, day and agenda views with your tasks laid over them.",
    tone: "green",
    status: "live",
  },
  {
    icon: faComments,
    t: "Chat with AI",
    d: "Folders, pinned chats, share links, and drafts you confirm before anything is saved.",
    tone: "mint",
    status: "live",
  },
  {
    icon: faMagnifyingGlass,
    t: "Universal search",
    d: "One search box across tasks, notes, journal and chats. Press ⌘K anywhere.",
    tone: "gold",
    status: "live",
  },
  {
    icon: faEnvelope,
    t: "Email",
    d: "Gmail and Outlook threads beside your notes. Compose, reply and forward.",
    tone: "clay",
    status: "soon",
  },
  { icon: faMicrophone, t: "Meetings", d: "Capture, transcribe and turn a meeting into follow-ups.", tone: "sand", status: "soon" },
  { icon: faRoute, t: "Automations", d: "Rules that handle the repetitive parts for you.", tone: "violet", status: "soon" },
];

export const NOTE_POINTS: [IconDefinition, string, string][] = [
  [faPenToSquare, "Rich notes", "Give each note a colour and drag them into the order you want."],
  [faWandMagicSparkles, "Slash commands", "Type / to format as you write, without reaching for a toolbar."],
  [faMicrophone, "Dictate", "Speak and watch it turn into text."],
  [faPaperclip, "Attachments", "Keep the files and images a note needs inside the note."],
  [faClockRotateLeft, "Version history", "Go back to an earlier version whenever you need to."],
  [faFileExport, "Export as Markdown", "Your notes are yours to take with you, from Settings."],
];

export const TASK_POINTS: [IconDefinition, string, string][] = [
  [faListCheck, "Lists and priorities", "Sort work into lists and set priority from urgent to low."],
  [faClockRotateLeft, "Repeats", "Daily, weekly or on the 2nd Wednesday. Finish one and the next appears."],
  [faTableColumns, "Three ways to look", "List, board or calendar, whichever suits the day."],
  [faMagnifyingGlass, "Keyboard first", "Q to add, G then T for today, 1 to 4 for priority."],
];

export const JOURNAL_POINTS: [IconDefinition, string, string][] = [
  [faBookOpen, "Many entries a day", "Write as often as you think of something."],
  [faLock, "Private to you", "Your journal is kept apart from the rest of the workspace."],
  [faMicrophone, "Voice and attachments", "Dictate an entry or attach a photo or file."],
  [faCalendarDays, "Browse by calendar", "Jump to any day and see what you wrote."],
];

export const COLLAB_POINTS: [IconDefinition, string, string][] = [
  [faUserGroup, "Write together", "Start a shared journal and write in it with the people you invite."],
  [faEnvelope, "Invite by username or email", "They join when they accept, and an email lets them know they were invited."],
  [faPenToSquare, "Editor or viewer", "Choose who can write and who can only read. The owner can change it at any time."],
  [faPaperclip, "Photos and files", "Everyone can add entries with photos and files, and see who wrote what."],
];

export const CALENDAR_POINTS: [IconDefinition, string, string][] = [
  [faCalendarDays, "Four views", "Month, week, day and agenda. Your phone opens on the agenda."],
  [faListCheck, "Tasks on the calendar", "Tasks with a due date appear beside your events. Toggle them off any time."],
  [faWandMagicSparkles, "Eight colours", "Tint each event to match the way you think about it."],
  [faMagnifyingGlass, "One key for everything", "T for today, M, W, D and A for the views, C for a new event."],
];

export const CHAT_POINTS: [IconDefinition, string, string][] = [
  [faComments, "Organised", "Folders, pinned chats and unread markers keep it tidy."],
  [faWandMagicSparkles, "You approve every save", "The AI can draft a note, journal entry or to-do. Nothing is saved until you confirm."],
  [faShareNodes, "Share one chat", "Send a read-only link to a single conversation, and stop sharing whenever you like."],
  [faFileExport, "Export", "Take a conversation with you."],
];

export const SHORTCUTS: { keys: string[]; label: string; group: string }[] = [
  { keys: ["⌘", "K"], label: "Search everything", group: "Anywhere" },
  { keys: ["?"], label: "Show all shortcuts", group: "Anywhere" },
  { keys: ["Q"], label: "Quick add a task", group: "Tasks" },
  { keys: ["G", "T"], label: "Go to Today", group: "Tasks" },
  { keys: ["1"], label: "Set priority to urgent", group: "Tasks" },
  { keys: ["E"], label: "Edit the focused task", group: "Tasks" },
  { keys: ["T"], label: "Jump to today", group: "Calendar" },
  { keys: ["W"], label: "Week view", group: "Calendar" },
  { keys: ["C"], label: "New event", group: "Calendar" },
];

export const TRUST: { icon: IconDefinition; t: string; d: string; tip: string; tone: Tone }[] = [
  {
    icon: faFingerprint,
    t: "Passkeys",
    d: "Sign in with your fingerprint, face or device, with no password to leak.",
    tip: "Passkeys use WebAuthn. Your device holds the secret; we never see it.",
    tone: "violet",
  },
  {
    icon: faKey,
    t: "Google or email",
    d: "Continue with Google (including One Tap), or use a username and password.",
    tip: "We show a “Last used” hint so you can find the way you signed in before.",
    tone: "blue",
  },
  {
    icon: faShieldHalved,
    t: "Safe password resets",
    d: "Six-digit codes that expire in five minutes, stored hashed, with limited attempts.",
    tip: "The reset form gives the same answer whether or not an account exists, so it can’t be used to look people up.",
    tone: "green",
  },
  {
    icon: faUserLock,
    t: "A private journal",
    d: "Your journal entries belong to you alone, even inside a shared workspace.",
    tip: "Journal entries are scoped to their author at the database level.",
    tone: "amber",
  },
  {
    icon: faLock,
    t: "Protected at the database",
    d: "Every table has row-level security, so the database itself checks who may see a row.",
    tip: "Permissions aren’t only enforced in the interface; they’re enforced where the data lives.",
    tone: "mint",
  },
  {
    icon: faFileExport,
    t: "Export and delete",
    d: "Export your data, reset your workspace, or delete your account and its files.",
    tip: "Account deletion removes your rows and your stored files.",
    tone: "clay",
  },
];

export const FAQS: [string, string][] = [
  ["Do I have to use AI?", "No. Use AI when it helps, or keep your workspace fully AI-free. The workspace works the same either way."],
  [
    "What happens if I switch AI provider or model?",
    "Nothing happens to your content. Your notes, tasks, journal and everything you’ve built stay exactly where they are. The workspace is separate from the AI you choose.",
  ],
  [
    "What can I use today, and what is still coming?",
    "Notes, tasks, journal, calendar, chat with AI and universal search are live. Email, meetings and automations are still being built, and the page says so wherever they appear.",
  ],
  [
    "Can the AI change my things without asking?",
    "No. When the assistant drafts a note, a journal entry or a to-do, you see a preview and confirm before anything is saved.",
  ],
  [
    "How do I sign in?",
    "With a passkey, with Google (including One Tap), or with a username and password. If you forget a password, a six-digit code to your email lets you reset it.",
  ],
  ["Is my journal private?", "Yes. Journal entries are private to their author, kept apart from the rest of the workspace."],
  [
    "Can I write a journal with someone else?",
    "Yes. Start a shared journal and invite people by username or email. Each person can be an editor or a viewer, and they join only after they accept. Your personal journal stays private to you.",
  ],
  [
    "Can I bring my existing notes, and take them out again?",
    "Yes. Import your existing work (including from Notion) and export it whenever you need to. You can also export your data from Settings.",
  ],
  [
    "Which email and calendar services will connect?",
    "Gmail and Outlook for email, and Google Calendar for events. With Pro you can connect up to 5 email accounts and up to 5 calendars.",
  ],
  [
    "Does it connect to the tools my team already uses?",
    "That is the direction: Slack, Google Drive, Docs and Sheets, Notion, GitHub, Linear, HubSpot, Zoom, Google Meet and Microsoft Teams, plus Cloudflare, Eventbrite and Maps. Each one is marked live or coming soon on the integrations list.",
  ],
  [
    "How do I pay for AI?",
    "Bring your own API key, connect an AI account you already have, or top up only when you need it. There’s no bundled AI subscription.",
  ],
  [
    "Does it work on my phone?",
    "Yes. Every screen is built mobile-first, so the calendar opens on the agenda and the workspace works at phone width.",
  ],
];

export const GROUPS = [
  {
    name: "Communication",
    items: [
      { name: "Gmail", use: "Fetch & send mail" },
      { name: "Outlook", use: "Draft follow-ups" },
      { name: "Slack", use: "Send recaps" },
    ],
  },
  {
    name: "Calendar & meetings",
    items: [
      { name: "Google Calendar", use: "Sync events" },
      { name: "Google Meet", use: "Meetings" },
      { name: "Microsoft Teams", use: "Meetings" },
      { name: "Zoom", use: "Meetings" },
    ],
  },
  {
    name: "Data",
    items: [
      { name: "Google Drive", use: "Backup files" },
      { name: "Google Docs", use: "Documents" },
      { name: "Google Sheets", use: "Answer from data" },
      { name: "Notion", use: "Import notes" },
    ],
  },
  {
    name: "Work",
    items: [
      { name: "GitHub", use: "Track issues" },
      { name: "Linear", use: "Move tickets" },
      { name: "HubSpot", use: "Log CRM activity" },
    ],
  },
  {
    name: "More",
    items: [
      { name: "Cloudflare", use: "Watch your sites" },
      { name: "Eventbrite", use: "Manage events" },
      { name: "Maps", use: "Location workflows" },
    ],
  },
] as const;
export const ALL_INTEGRATIONS = GROUPS.flatMap((g) => g.items.map((x) => x.name));
