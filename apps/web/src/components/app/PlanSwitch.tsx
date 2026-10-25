"use client";
import PillSwitch, { type PillPage } from "./PillSwitch";

/** The pages that share the "Plan" tab. Each keeps its own address, so links from search, chat and the calendar still land on it. */
const PAGES: PillPage[] = [
  { href: "/dashboard/todo", t: "To-do", match: (p) => p.startsWith("/dashboard/todo") },
  { href: "/dashboard/notes", t: "Notes", match: (p) => p.startsWith("/dashboard/notes") },
  { href: "/dashboard/calendar", t: "Calendar", match: (p) => p.startsWith("/dashboard/calendar") },
  { href: "/dashboard/health", t: "Health", match: (p) => p.startsWith("/dashboard/health") },
];

/** Pill switch between To-do, Notes, Calendar and Health at the top of each page. */
export default function PlanSwitch() {
  return <PillSwitch label="Plan" pages={PAGES} />;
}
