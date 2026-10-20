/**
 * Query keys, in one place. Keys are hierarchical arrays: invalidating `["tasks"]` refreshes every query that starts with it
 * (the To-do page's full list AND the Home card's subset), so one mutation keeps every screen in sync.
 *
 * Add a key here before using it. Never inline key arrays in components.
 */
export const qk = {
  tasks: {
    all: ["tasks"] as const,
    list: ["tasks", "all"] as const, // every task (To-do page)
    home: (today: string) => ["tasks", "home", today] as const, // open tasks + today's (Home card)
  },
  taskLists: ["task-lists"] as const,
  notes: { all: ["notes"] as const },
  journal: {
    all: ["journal"] as const,
    home: (today: string) => ["journal", "home", today] as const, // today's latest entries (Home card)
    day: (date: string) => ["journal", "day", date] as const,
    counts: ["journal", "counts"] as const,
  },
  sharedJournals: {
    all: ["shared-journals"] as const,
    list: ["shared-journals", "list"] as const,
    invites: ["shared-journals", "invites"] as const, // invitations waiting for the signed-in person
    detail: (id: string) => ["shared-journals", "detail", id] as const,
    entries: (id: string) => ["shared-journals", "entries", id] as const,
  },
  signedUrls: (bucket: string, paths: string[]) => ["signed-urls", bucket, paths] as const, // expiring links for stored files
  chats: {
    all: ["chats"] as const,
    list: ["chats", "list"] as const,
    recent: ["chats", "recent"] as const, // latest few (Home card)
    folders: ["chats", "folders"] as const,
    messages: (chatId: string) => ["chats", "messages", chatId] as const,
  },
  calendar: { all: ["calendar"] as const, events: ["calendar", "events"] as const },
  health: { all: ["health"] as const, days: (span: number) => ["health", "days", span] as const },
  profile: ["profile"] as const,
  aiProviders: ["ai", "providers"] as const,
} as const;
