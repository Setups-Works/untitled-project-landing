import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faMagnifyingGlass, faCircleNodes, faNewspaper, faBookOpen, faPenToSquare, faEnvelope, faCalendarDays, faMicrophone, faPlug, faRoute, faTag, faShieldHalved, faSeedling,
} from "@fortawesome/free-solid-svg-icons";
export const FEATURES = [
  { href: "/universal-search", t: "Universal Search", d: "Find anything across notes, tasks, mail and meetings." },
  { href: "/context-graph", t: "Context Graph", d: "See how your work connects." },
  { href: "/daily-brief", t: "Daily Brief", d: "Start the day knowing what matters." },
];

export const NAV_LINKS = [
  { href: "/how-it-works", t: "How it works" },
  { href: "/demo", t: "Product demo" },
  { href: "/pricing", t: "Pricing" },
  { href: "/privacy-security", t: "Privacy & Security" },
];

/** Flat list for the mobile menu */
export const MENU: [string, string][] = [
  ["How it works", "/how-it-works"],
  ["Universal Search", "/universal-search"],
  ["Context Graph", "/context-graph"],
  ["Daily Brief", "/daily-brief"],
  ["Product demo", "/demo"],
  ["Pricing", "/pricing"],
  ["Privacy & Security", "/privacy-security"],
  ["Early users", "/early-users"],
];

export const FOOTER_COLS: { title: string; links: [string, string][] }[] = [
  {
    title: "Product",
    links: [
      ["How it works", "/how-it-works"],
      ["Product demo", "/demo"],
      ["Pricing", "/pricing"],
      ["Early users", "/early-users"],
    ],
  },
  {
    title: "Features",
    links: [
      ["Universal Search", "/universal-search"],
      ["Context Graph", "/context-graph"],
      ["Daily Brief", "/daily-brief"],
      ["AI on your terms", "/#ai"],
    ],
  },
  {
    title: "Workspace",
    links: [
      ["Journal", "/#journal"],
      ["Notes", "/#notes"],
      ["Email", "/#email"],
      ["Calendar", "/#calendar"],
      ["Integrations", "/#integrations"],
    ],
  },
  {
    title: "Trust",
    links: [
      ["Privacy & Security", "/privacy-security"],
      ["FAQ", "/#faq"],
    ],
  },
];

export type MegaItem = { href: string; t: string; d: string; icon: IconDefinition; tone?: string; kind?: string; tags?: string[] };

/** Content of the "Features" mega menu */
export const MEGA: { featured: MegaItem[]; workspace: MegaItem[]; explore: MegaItem[] } = {
  featured: [
    { href: "/universal-search", t: "Universal Search", d: "Find anything across notes, tasks, mail and meetings from one box.", icon: faMagnifyingGlass, tone: "blue", kind: "search", tags: ["Notes", "Mail", "Meetings", "Works without AI"] },
    { href: "/context-graph", t: "Context Graph", d: "See how your notes, threads, meetings and tasks connect.", icon: faCircleNodes, tone: "violet", kind: "graph", tags: ["Backlinks", "Atlas", "Context"] },
    { href: "/daily-brief", t: "Daily Brief", d: "Start the day with events, tasks and mail on one page.", icon: faNewspaper, tone: "amber", kind: "brief", tags: ["Calendar", "Tasks", "AI optional"] },
  ],
  workspace: [
    { href: "/#journal", t: "Journal", d: "A private record of your days", icon: faBookOpen },
    { href: "/#notes", t: "Notes", d: "Think, write and organize", icon: faPenToSquare },
    { href: "/#email", t: "Email", d: "Gmail in the workspace", icon: faEnvelope },
    { href: "/#calendar", t: "Calendar", d: "One view of your time", icon: faCalendarDays },
    { href: "/#areas", t: "Meetings", d: "Capture, transcribe, follow through", icon: faMicrophone },
    { href: "/#integrations", t: "Integrations", d: "Connect the tools you use", icon: faPlug },
  ],
  explore: [
    { href: "/how-it-works", t: "How it works", d: "", icon: faRoute },
    { href: "/pricing", t: "Pricing", d: "", icon: faTag },
    { href: "/privacy-security", t: "Privacy & Security", d: "", icon: faShieldHalved },
    { href: "/early-users", t: "Early users", d: "", icon: faSeedling },
  ],
};
