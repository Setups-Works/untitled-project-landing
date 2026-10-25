"use client";
import { FEATURES } from "../../config/features";
import PillSwitch, { type PillPage } from "./PillSwitch";

/** The pages that share the "Workspace" tab. Each keeps its own address. */
const PAGES: PillPage[] = [
  { href: "/dashboard/workspace", t: "Workspace", match: (p) => p === "/dashboard/workspace" },
  ...(FEATURES.rssReader ? [{ href: "/dashboard/workspace/reader", t: "Reader", match: (p: string) => p.startsWith("/dashboard/workspace/reader") }] : []),
];

/** Pill switch between Workspace and the Reader at the top of each page. */
export default function WorkspaceSwitch() {
  return <PillSwitch label="Workspace" pages={PAGES} />;
}
