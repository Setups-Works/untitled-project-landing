import type { Tone } from "../../lib/tones";

export type Platform = "web" | "app";
export type ChangeKind = "new" | "improved" | "fixed";

export type Change = { kind: ChangeKind; platform: Platform; text: string };

export type Release = {
  /** ISO calendar day, newest first in the list. */
  date: string;
  title: string;
  summary: string;
  tone: Tone;
  /** The Android app's version tag, when the day shipped one. It links to the matching GitHub Release. */
  appVersion?: string;
  changes: Change[];
};

/**
 * The public changelog, newest first. Add an entry when something people can see ships; keep each line to what changed for
 * them, not how. App releases are published as GitHub Releases, so `appVersion` is the tag name (`v1.0.1`).
 */
export const RELEASES: Release[] = [
  {
    date: "2026-10-26",
    title: "Version 2.3: a calmer Home you can rearrange",
    summary: "Home is rebuilt in clean liquid glass, shows more of your workspace, and you can drag its cards into the order you like.",
    tone: "violet",
    appVersion: "v2.3.0",
    changes: [
      { kind: "new", platform: "web", text: "Drag the cards on Home into your own order using the grip on each card, or focus the grip and press the up and down arrow keys. Your order is remembered in this browser." },
      { kind: "new", platform: "app", text: "Touch and hold a section on Home, then drag it up or down to rearrange it. The order is remembered on your phone." },
      { kind: "new", platform: "web", text: "Home now shows today’s schedule, your latest Reader articles with the unread count, today’s steps and sleep, and a note when a shared journal invitation is waiting." },
      { kind: "improved", platform: "web", text: "Home has a new minimal look: neutral liquid-glass cards, a serif greeting, one place to add today’s tasks and one for your journal, and quick links across the top." },
      { kind: "improved", platform: "web", text: "Home works better on phones: the quick links scroll sideways and the cards stack in a single column." },
      { kind: "improved", platform: "web", text: "Journal entries are now separate glass cards with the time, how long ago you wrote them and a menu for edit, share and delete." },
      { kind: "improved", platform: "web", text: "The Journal page fits the screen: your entries sit above the writing box, which stays in view." },
    ],
  },
  {
    date: "2026-10-25",
    title: "Version 2.2.1: a sidebar for the Reader in the app",
    summary: "The Reader in the app now has the same sidebar as the web, and it stays up to date when you come back to it.",
    tone: "mint",
    appVersion: "v2.2.1",
    changes: [
      { kind: "new", platform: "app", text: "The Reader has a sidebar like the web: add a feed, switch between all, unread and starred articles, and pick a feed from your list with its logo and unread count. It opens from the menu button on phones and stays open on tablets." },
      { kind: "improved", platform: "app", text: "The Reader catches up with new feeds and articles whenever you reopen the app." },
    ],
  },
  {
    date: "2026-10-25",
    title: "Version 2.2: a Reader and a Workspace tab",
    summary: "Follow the sites you like and read them in one place, and find Health inside Plan.",
    tone: "green",
    appVersion: "v2.2.0",
    changes: [
      { kind: "new", platform: "web", text: "A new Reader in the Workspace tab: add a feed or just a website address, then read articles with their picture and description, search them, and filter by unread or starred." },
      { kind: "new", platform: "app", text: "The Workspace tab has the same Reader: follow feeds, search, star articles and open them to read in full." },
      { kind: "new", platform: "web", text: "Workspace now has a switcher between the Workspace page, which is coming soon, and the Reader." },
      { kind: "improved", platform: "web", text: "Health moved into Plan, next to To-do, Notes and Calendar." },
      { kind: "improved", platform: "app", text: "Health moved into the Plan tab, and Workspace takes its place in the tab bar. Links to Health still work." },
    ],
  },
  {
    date: "2026-10-21",
    title: "Version 2.1: collaboration on the home page",
    summary: "The home page now shows what writing a journal together looks like, in the same phone card as the other features.",
    tone: "clay",
    appVersion: "v2.1.0",
    changes: [
      { kind: "new", platform: "web", text: "A new Collaborate section on the home page shows shared journals: invite people by username or email, choose who can write and who can only read, and add photos and files." },
    ],
  },
  {
    date: "2026-10-21",
    title: "The phone previews now show on mobile",
    summary: "The app screenshots on the home page appear on phones too, not only on wide screens.",
    tone: "sand",
    changes: [{ kind: "improved", platform: "web", text: "The iPhone previews of Notes, To-do, Journal, Chat and Home on our home page now show on phones and tablets as well." }],
  },
  {
    date: "2026-10-21",
    title: "A new AI icon",
    summary: "The AI button in notes now uses the grainy blue-to-coral pill.",
    tone: "violet",
    changes: [{ kind: "improved", platform: "web", text: "The AI button in the note editor has a new look: a grainy blue-to-coral pill." }],
  },
  {
    date: "2026-10-21",
    title: "Switch between your journal and shared journals",
    summary: "Personal and Collaboration now sit side by side at the top of the Journal pages, like the Plan pages.",
    tone: "blue",
    changes: [
      { kind: "improved", platform: "web", text: "A Personal / Collaboration switch at the top of the Journal pages replaces the Collaborate button and the back link. Invitations waiting for your answer show as a number on Collaboration." },
    ],
  },
  {
    date: "2026-10-21",
    title: "AI in your notes, a fuller assistant and email invites",
    summary: "Improve or summarise a note with AI, do more from the chat bubble, and invite people to a shared journal by email.",
    tone: "violet",
    changes: [
      { kind: "new", platform: "web", text: "AI actions in the note editor: improve the writing, fix spelling and grammar, make it shorter or longer, summarise, find action items, continue writing, or ask for anything. It works on your selection or the whole note, and nothing changes until you press Replace or Insert below." },
      { kind: "improved", platform: "web", text: "The chat bubble now does what the full chat does: attach files, record voice notes, choose the AI, browse recent chats, and rename, pin, share, export, clear or delete a conversation." },
      { kind: "new", platform: "web", text: "Invite someone to a shared journal by their email address as well as their username. They get an email with a link to accept." },
      { kind: "new", platform: "web", text: "Every section of Settings has its own address, such as /dashboard/settings/security, so you can bookmark or share it." },
      { kind: "fixed", platform: "web", text: "Profile pictures now show in shared journals instead of initials, and the people and role badge line up in the journal header." },
    ],
  },
  {
    date: "2026-10-21",
    title: "Ask the assistant to show your things",
    summary: "Say “show my journal from yesterday” and the chat answers with cards you can open. Shared links also look cleaner.",
    tone: "mint",
    appVersion: "v2.0.1",
    changes: [
      { kind: "new", platform: "web", text: "Ask the assistant to show your journal, to-dos, notes or health (for example “show my journal from yesterday”) and it answers with cards and an Open button. It never reads your data: the app fetches it." },
      { kind: "new", platform: "app", text: "The same cards in the app’s chat, in the app’s own colours." },
      { kind: "improved", platform: "web", text: "Links to a shared chat or journal entry show only a small header, without the website’s menu and footer." },
    ],
  },
  {
    date: "2026-10-21",
    title: "Version 2.0: write together, widgets and in-app updates",
    summary: "Shared journals with invitations, home-screen widgets, a redesigned journal, sharing an entry as a link or picture, and updating the Android app from inside it.",
    tone: "gold",
    appVersion: "v2.0.0",
    changes: [
      { kind: "new", platform: "web", text: "Collaborate from the Journal: create a shared journal, invite people by their username, and choose whether each person can write or only read." },
      { kind: "new", platform: "app", text: "The same shared journals in the Android app, with a Collaboration page for invitations, people and roles." },
      { kind: "new", platform: "web", text: "Invitations wait for an answer: accept to join, or decline. The Collaborate button shows how many are waiting." },
      { kind: "new", platform: "app", text: "Everyone in a shared journal can add entries with photos and files, and see who wrote what." },
      { kind: "new", platform: "web", text: "Share one journal entry with a secret link anyone can read, or as a picture. You can switch the link off at any time." },
      { kind: "new", platform: "app", text: "The same sharing from the app: share an entry as a link or as an image from its menu." },
      { kind: "new", platform: "app", text: "Home-screen widgets on iPhone and Android: today’s tasks, quick write, health today, and your latest journal entry with your writing streak." },
      { kind: "new", platform: "web", text: "A note about your health ends with an “Open in Health” link that jumps to that day on the Health page." },
      { kind: "new", platform: "app", text: "The same link in the app opens Health on the right day." },
      { kind: "fixed", platform: "app", text: "The Health day picker matches the Journal’s, and “Nothing recorded” is centred instead of squeezed to one side." },
      { kind: "new", platform: "app", text: "Update the app from inside it: Settings → About and updates checks GitHub, downloads the new version with a progress bar and opens the installer." },
      { kind: "new", platform: "app", text: "Add a link from the writing page: type an address, or pick Health or Journal to link to those pages in the app." },
      { kind: "improved", platform: "app", text: "The Journal is a timeline of coloured cards with a new day picker. Swipe sideways to move between your journal and your shared journals." },
      { kind: "improved", platform: "app", text: "A journal entry opens in a sheet like a note, and you can remove or add its photos, audio and files while editing." },
      { kind: "improved", platform: "app", text: "Every delete asks with the same dialog, and notes and journal entries open in the same writing page, with a title, colour and category for notes." },
      { kind: "improved", platform: "web", text: "The API reference (Swagger) lists every endpoint, including shared journals and sharing an entry." },
      { kind: "improved", platform: "web", text: "The chat shows the AI model by name, and you can pick any free model." },
      { kind: "improved", platform: "app", text: "The same model picker in the app." },
      { kind: "fixed", platform: "web", text: "Words in *italics* from the assistant now show as italics instead of stray asterisks." },
      { kind: "fixed", platform: "app", text: "Notes the assistant drafts show up with their Save button more reliably." },
    ],
  },
  {
    date: "2026-10-20",
    title: "Share your welcome card",
    summary: "The welcome gift card looks the same on the web and in the app, and you can share it as an image with a caption.",
    tone: "violet",
    appVersion: "v1.0.7",
    changes: [
      { kind: "new", platform: "app", text: "The welcome gift card in Settings is now the same iridescent foil card as on the web, with your name engraved on it." },
      { kind: "new", platform: "app", text: "Share card sends the card as an image together with a caption." },
      { kind: "new", platform: "web", text: "Share the card from the welcome screen or Settings. On phones it opens the share sheet with the image and caption; on desktop it downloads the image." },
    ],
  },
  {
    date: "2026-10-20",
    title: "Pick your AI model",
    summary: "The chat now shows which model answers and lets you choose any free model. Chat actions are easier to reach.",
    tone: "mint",
    appVersion: "v1.0.6",
    changes: [
      { kind: "new", platform: "web", text: "The chat shows the model’s name and lets you pick from every free model available, instead of a single provider." },
      { kind: "new", platform: "app", text: "The same model picker in the Android app, with the model name next to the message box." },
      { kind: "new", platform: "app", text: "Press and hold a chat in Recent chats to pin, rename, share, export, clear or delete it." },
      { kind: "improved", platform: "app", text: "Pinned chats sit in their own section at the top of Recent chats." },
      { kind: "improved", platform: "app", text: "The chat actions menu has a solid background, so it is easier to read." },
    ],
  },
  {
    date: "2026-10-17",
    title: "Health drafts that show up",
    summary: "Saving a health summary as a note now works, and missing figures are no longer reported as zero.",
    tone: "clay",
    appVersion: "v1.0.5",
    changes: [
      { kind: "fixed", platform: "app", text: "“Save as note” and “Add to journal” from Health show their draft in the chat. A note with a list in it used to disappear." },
      { kind: "fixed", platform: "web", text: "The same fix on the web: a draft with a multi-line body is kept instead of silently dropped." },
      { kind: "fixed", platform: "web", text: "The assistant says a figure was not recorded instead of reporting 0 m, 0 kcal or 0 minutes for it." },
    ],
  },
  {
    date: "2026-10-17",
    title: "A detail page for every health metric",
    summary: "Tap steps, sleep, distance, energy or heart rate to see it day by day. Health is also more accurate.",
    tone: "violet",
    appVersion: "v1.0.4",
    changes: [
      { kind: "new", platform: "web", text: "Each Health tile opens a page with a chart per day, your average, best and lowest day, and every day listed." },
      { kind: "new", platform: "app", text: "The same detail screen in the Android app, opened from any Health tile." },
      { kind: "new", platform: "web", text: "Ask the assistant about one metric from its detail page." },
      { kind: "new", platform: "app", text: "Ask the assistant about one metric from its detail screen." },
      { kind: "improved", platform: "app", text: "Health now picks a day like the Journal: step with the arrows or choose any day from the calendar." },
      { kind: "improved", platform: "web", text: "The same day picker on the Health page, with a dot on days that have data." },
      { kind: "fixed", platform: "app", text: "Sleep is counted for the day you wake up, so a night that crosses midnight is no longer split in two." },
      { kind: "fixed", platform: "app", text: "Today’s steps are never behind: the newest reading from your phone is shown first, and it syncs when you return to the app." },
      { kind: "improved", platform: "app", text: "Syncing is faster and lighter. It reads each metric once for the whole week and skips uploading when nothing changed." },
      { kind: "fixed", platform: "web", text: "A moment with no reading no longer erases a number that was already saved." },
    ],
  },
  {
    date: "2026-10-17",
    title: "Health by day, and a chat that knows your numbers",
    summary: "Pick Today, Yesterday, 7 days or 30 days, and hand what you see to the assistant.",
    tone: "blue",
    appVersion: "v1.0.3",
    changes: [
      { kind: "new", platform: "app", text: "A “Sync this phone” switch. Turn it on only for the phone you wear; any other phone shows your account’s data without overwriting it." },
      { kind: "fixed", platform: "app", text: "A second phone no longer asks you to connect Health when your account already has data." },
      { kind: "new", platform: "web", text: "Health filter for Today, Yesterday, 7 days and 30 days, with totals, averages and a steps chart for the range." },
      { kind: "new", platform: "app", text: "The same filter and a refreshed Health layout in the Android app." },
      { kind: "new", platform: "web", text: "Ask the assistant, Add to journal and Save as note from Health. The assistant drafts it and you confirm in the chat." },
      { kind: "new", platform: "app", text: "The same three actions in the app, opening a new chat with your numbers." },
      { kind: "improved", platform: "web", text: "The assistant sees 30 days of health data and knows which day is today and yesterday." },
    ],
  },
  {
    date: "2026-10-17",
    title: "Health syncs, and the app updates itself",
    summary: "Partial health data now shows up, and new Android versions are offered inside the app.",
    tone: "mint",
    appVersion: "v1.0.2",
    changes: [
      { kind: "new", platform: "app", text: "The app checks GitHub for a newer version when it opens and offers to install it." },
      { kind: "fixed", platform: "app", text: "Health no longer fails to sync when one reading, such as resting heart rate, is missing." },
      { kind: "improved", platform: "app", text: "Each Health tile shows its most recent value, and says which day it’s from when it isn’t today." },
      { kind: "improved", platform: "app", text: "Health shows what your phone read even when it can’t be saved to your account yet." },
      { kind: "fixed", platform: "web", text: "A reading outside the possible range is stored as no data instead of rejecting the whole sync." },
      { kind: "new", platform: "web", text: "This changelog page, covering both the web app and the Android app." },
      { kind: "improved", platform: "web", text: "Emails carry the ghost logo." },
    ],
  },
  {
    date: "2026-10-17",
    title: "Health sync tells you what went wrong",
    summary: "When the phone can’t send your health data, the app now says why instead of waiting forever.",
    tone: "clay",
    appVersion: "v1.0.1",
    changes: [
      { kind: "fixed", platform: "app", text: "The Health tab shows the real sync error with a Retry button, instead of “Syncing” that never ends." },
      { kind: "improved", platform: "app", text: "Clearer states for syncing, nothing synced yet, and a sync that failed." },
      { kind: "improved", platform: "web", text: "Health sync failures are recorded on the server so they can be diagnosed." },
      { kind: "improved", platform: "web", text: "The API reference and Swagger UI now list the Health endpoints." },
    ],
  },
  {
    date: "2026-10-17",
    title: "Health, Plan and the Android app",
    summary: "Your steps, sleep and heart rate in one place, and a first Android release you can install.",
    tone: "green",
    appVersion: "v1.0.0",
    changes: [
      { kind: "new", platform: "app", text: "Health tab: steps, distance, active energy, sleep and heart rate from Health Connect." },
      { kind: "new", platform: "web", text: "Health page on the web, fed by your phone, and available to the assistant as context." },
      { kind: "new", platform: "app", text: "Plan tab for what’s coming up." },
      { kind: "new", platform: "app", text: "Animated splash screen, ghost branding and audio that matches the web app." },
      { kind: "new", platform: "app", text: "Android builds are published as GitHub Releases whenever a version is tagged." },
    ],
  },
  {
    date: "2026-10-13",
    title: "A closer match to the web",
    summary: "The app picks up the web’s dialogs, a floating bar on Android and a redesigned home.",
    tone: "blue",
    changes: [
      { kind: "improved", platform: "app", text: "Confirm dialogs styled like the web’s, and a floating navigation bar on Android." },
      { kind: "improved", platform: "app", text: "Redesigned home dashboard." },
      { kind: "new", platform: "app", text: "Personality insights." },
      { kind: "improved", platform: "app", text: "Workspace features brought in line with the web app." },
      { kind: "improved", platform: "web", text: "The web app now deploys automatically to Azure from a container image." },
    ],
  },
  {
    date: "2026-10-12",
    title: "The mobile app begins",
    summary: "To-do, Notes, Journal and Chat on your phone, and a refreshed look for the site.",
    tone: "violet",
    changes: [
      { kind: "new", platform: "app", text: "Mobile app with onboarding, sign-in, To-do, Notes, Journal and Chat." },
      { kind: "new", platform: "app", text: "Liquid-glass cards on every page, and swipe to delete." },
      { kind: "improved", platform: "web", text: "Redesigned landing site with liquid-glass surfaces and motion." },
    ],
  },
  {
    date: "2026-10-10",
    title: "Calendar",
    summary: "See your time as a month, week, day or agenda.",
    tone: "amber",
    changes: [
      { kind: "new", platform: "web", text: "Calendar with month, week, day and agenda views." },
      { kind: "new", platform: "web", text: "Design language guide so every screen looks like one product." },
    ],
  },
  {
    date: "2026-10-09",
    title: "A welcome gift and tidier admin",
    summary: "New people get a card with their name on it.",
    tone: "gold",
    changes: [
      { kind: "new", platform: "web", text: "Welcome gift card after onboarding, downloadable from Settings." },
      { kind: "fixed", platform: "web", text: "Admin confirm dialogs open correctly, and dates no longer flicker on load." },
    ],
  },
  {
    date: "2026-10-08",
    title: "APIs, right-click and liquid glass",
    summary: "A public API for your notes, to-dos and journal, plus a lot of polish.",
    tone: "mint",
    changes: [
      { kind: "new", platform: "web", text: "REST API for notes, to-dos and journal, documented in Swagger UI." },
      { kind: "new", platform: "web", text: "Right-click menu with actions for the thing under the cursor." },
      { kind: "new", platform: "web", text: "Repeating to-dos on the n-th weekday of the month, shown on the calendar." },
      { kind: "new", platform: "web", text: "Turn a chat message into a journal entry, to-dos and notes, created only after you confirm." },
      { kind: "improved", platform: "web", text: "Liquid-glass dialogs, menus, cards and search." },
      { kind: "new", platform: "web", text: "Admins can see and end a person’s sign-ins, and ban with a reason and length." },
    ],
  },
];

export const KIND_LABEL: Record<ChangeKind, string> = { new: "New", improved: "Improved", fixed: "Fixed" };
export const PLATFORM_LABEL: Record<Platform, string> = { web: "Web", app: "App" };

export type PlatformFilter = "all" | Platform;

/** The changes shown for a filter; releases with nothing left are dropped. */
export function filterReleases(releases: Release[], filter: PlatformFilter): Release[] {
  if (filter === "all") return releases;
  return releases
    .map((r) => ({ ...r, changes: r.changes.filter((c) => c.platform === filter) }))
    .filter((r) => r.changes.length > 0);
}
