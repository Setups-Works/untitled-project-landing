"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Prefs } from "../../lib/prefs";
import PrefsSync from "./PrefsSync";
import SettingsModal from "./SettingsModal";
import { OPEN_ONBOARDING_EVENT } from "./Onboarding";
import UniversalSearch, { OPEN_SETTINGS_EVENT } from "./UniversalSearch";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import {
  faHouse,
  faCalendarDays,
  faBookOpen,
  faComments,
  faPenToSquare,
  faListCheck,
  faShieldHalved,
  faRightFromBracket,
  faGear,
  faCompass,
} from "@fortawesome/free-solid-svg-icons";
import { authClient } from "../../lib/auth/client";
import { clearDrafts } from "../../lib/drafts";
import { useSwipeNav } from "../../hooks/useSwipeNav";
import SectionTabs from "./SectionTabs";

/** One line per workspace section — pages live in app/dashboard/<section>. */
const TABS = [
  { href: "/dashboard", t: "Home", icon: faHouse },
  { href: "/dashboard/calendar", t: "Calendar", icon: faCalendarDays },
  { href: "/dashboard/journal", t: "Journal", icon: faBookOpen },
  { href: "/dashboard/chat", t: "Chat", icon: faComments },
  { href: "/dashboard/notes", t: "Notes", icon: faPenToSquare },
  { href: "/dashboard/todo", t: "To-do", icon: faListCheck },
];

type Account = {
  name: string;
  email: string;
  username: string | null;
  displayUsername: string | null;
  hasPassword: boolean;
  providers: string[];
  createdAt: string;
  avatarUrl: string | null;
  lastSignIn: string | null;
};

export default function AppNav({
  name,
  email,
  admin,
  account,
  prefs,
}: {
  name: string;
  email: string;
  admin: boolean;
  account: Account;
  prefs: Prefs;
}) {
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState(false);
  const closeSettings = useCallback(() => setSettings(false), []);
  const box = useRef<HTMLDivElement>(null);

  // Which section we are on (the tab pill itself lives in SectionTabs).
  const current = TABS.findIndex((t) => (t.href === "/dashboard" ? path === "/dashboard" : path.startsWith(t.href)));

  // On a touch screen, swipe the page sideways to go to the next or previous section.
  useSwipeNav(current, TABS.length, (to) => router.push(TABS[to].href));

  useEffect(() => {
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, []);

  // Universal search can open Settings.
  useEffect(() => {
    const show = () => setSettings(true);
    window.addEventListener(OPEN_SETTINGS_EVENT, show);
    return () => window.removeEventListener(OPEN_SETTINGS_EVENT, show);
  }, []);

  async function signOut() {
    await clearDrafts(); // unsent text and recordings must not be visible to the next person on this computer
    await authClient.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="ap-bar">
      <Link href="/dashboard" className="logo ap-logo">
        <i />
        <span>untitled project</span>
      </Link>
      {/* Liquid-glass section switcher (click, or drag the glass lens across and let go) with the search button beside it. */}
      <div className="flex items-center gap-2.5">
        <SectionTabs tabs={TABS} current={current} onGo={(href) => router.push(href)} />
        <UniversalSearch
          admin={admin}
          className="relative size-12 justify-center rounded-full bg-white/60 p-0 text-[15px] text-fg-muted [&_kbd]:hidden [&_span]:hidden backdrop-blur-xl backdrop-saturate-150 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.85),inset_0_1px_3px_rgba(27,28,20,0.06)] transition-[transform,background-color,color,box-shadow] duration-300 ease-[cubic-bezier(0.34,1.45,0.5,1)] hover:bg-white/80 hover:text-fg hover:shadow-[inset_0_1px_0_#fff,inset_0_0_0_1px_rgba(255,255,255,0.95)] active:scale-95 motion-reduce:transition-none"
        />
      </div>
      <div className="ap-user" ref={box}>
        <button className="ap-avatar" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)} aria-label="Account menu">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {account.avatarUrl ? <img src={account.avatarUrl} alt="" /> : (name[0] || "?").toUpperCase()}
        </button>
        {open && (
          <div className="ap-menu" role="menu">
            <div className="ap-menu-id">
              <b>{name}</b>
              <small>{email}</small>
            </div>
            <button
              role="menuitem"
              onClick={() => {
                setOpen(false);
                setSettings(true);
              }}
            >
              <FA icon={faGear} /> Settings
            </button>
            <button
              role="menuitem"
              onClick={() => {
                setOpen(false);
                window.dispatchEvent(new Event(OPEN_ONBOARDING_EVENT));
              }}
            >
              <FA icon={faCompass} /> Getting started
            </button>
            {admin && (
              <Link role="menuitem" href="/admin" onClick={() => setOpen(false)}>
                <FA icon={faShieldHalved} /> Admin panel
              </Link>
            )}
            <button role="menuitem" onClick={signOut}>
              <FA icon={faRightFromBracket} /> Sign out
            </button>
          </div>
        )}
      </div>
      <PrefsSync prefs={prefs} />
      {settings && <SettingsModal account={account} prefs={prefs} onClose={closeSettings} />}
    </header>
  );
}
