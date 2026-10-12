"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import { faArrowRight, faChevronDown, faPlay, faXmark } from "@fortawesome/free-solid-svg-icons";
import AuthLink from "../auth/AuthLink";
import HeaderAuth from "../auth/HeaderAuth";
import { useAuthState } from "../auth/useAuthState";
import MegaPreview from "../MegaPreview";
import type { MegaItem } from "../../lib/site";
import { toneClass } from "../../lib/tones";
import { WRAP } from "./Kit";

type Mega = { featured: MegaItem[]; workspace: MegaItem[]; explore: MegaItem[] };

const linkCls =
  "inline-flex h-10 shrink-0 items-center gap-1.5 rounded-pill px-4 text-[14px] whitespace-nowrap text-fg-muted transition-[background-color,color,box-shadow] duration-300 hover:bg-white/70 hover:text-fg aria-[current=page]:bg-white aria-[current=page]:text-fg aria-[current=page]:shadow-e1 data-[active=true]:bg-white data-[active=true]:text-fg data-[active=true]:shadow-e1";

/** The site header. Its bar is transparent (no scroll-triggered frost); the glass lives in the nav pill and the menus. */
export function SiteHeaderBar({ mega, links, menu }: { mega: Mega; links: { href: string; t: string }[]; menu: [string, string][] }) {
  return (
    <header className="sticky top-0 z-50 pt-3">
      <div className={`${WRAP} flex items-center justify-between gap-4`}>
        <Link
          href="/"
          className="liquid-bar flex shrink-0 items-center gap-2.5 rounded-pill py-2 pr-5 pl-3.5 font-serif text-[23px] tracking-[-0.02em]"
        >
          <i className="size-2.5 rounded-full bg-green-fg shadow-[0_0_0_4px_var(--green-bg)]" aria-hidden />
          untitled project
        </Link>
        <NavMenu mega={mega} links={links} />
        <div className="flex items-center gap-2">
          <HeaderAuth />
          <MobileMenu links={menu} />
        </div>
      </div>
    </header>
  );
}

function NavMenu({ mega, links }: { mega: Mega; links: { href: string; t: string }[] }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState("demo");
  const wrap = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hold = () => {
    if (timer.current) clearTimeout(timer.current);
  };
  const show = () => {
    hold();
    setOpen(true);
  };
  const hide = () => {
    hold();
    timer.current = setTimeout(() => setOpen(false), 140);
  };
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    const out = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", out);
    window.addEventListener("keydown", k);
    return () => {
      document.removeEventListener("mousedown", out);
      window.removeEventListener("keydown", k);
    };
  }, []);
  const inFeatures = mega.featured.some((f) => f.href === path);
  const [first, ...rest] = links;
  return (
    <nav aria-label="Primary" className="liquid-bar hidden items-center gap-0.5 rounded-pill p-1 lg:flex">
      <Link href={first.href} className={linkCls} aria-current={path === first.href ? "page" : undefined}>
        {first.t}
      </Link>
      <div ref={wrap} onMouseEnter={show} onMouseLeave={hide} className="relative">
        <button
          className={linkCls}
          aria-expanded={open}
          aria-haspopup="true"
          aria-controls="mega"
          data-active={inFeatures}
          onClick={() => setOpen(!open)}
        >
          Features <FA icon={faChevronDown} className={`text-[10px] transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
        </button>
        {open && (
          <div
            id="mega"
            onMouseEnter={show}
            className="liquid-menu fixed top-[72px] left-1/2 w-[min(1080px,calc(100vw-32px))] -translate-x-1/2 animate-glass-in rounded-r4 p-5 motion-reduce:animate-none"
          >
            <div className="grid grid-cols-[1.25fr_1fr_1fr] gap-6">
              <div>
                <div className="mb-3 px-1 text-[11px] font-semibold tracking-[0.1em] text-fg-faint uppercase">Features</div>
                <div className="flex flex-col gap-2" onMouseLeave={() => setKind("demo")}>
                  {mega.featured.map((f) => (
                    <Link
                      key={f.href}
                      href={f.href}
                      aria-current={path === f.href ? "page" : undefined}
                      onMouseEnter={() => setKind(f.kind ?? "demo")}
                      onFocus={() => setKind(f.kind ?? "demo")}
                      className={`${toneClass(f.tone)} liquid-flat liquid-tint liquid-lift group flex items-start gap-3.5 rounded-r3 p-3.5`}
                    >
                      <span className="grid size-10 shrink-0 place-items-center rounded-r2 bg-white/70 text-[16px] text-(--abf)">
                        <FA icon={f.icon} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <b className="block text-[14.5px] font-semibold text-fg">{f.t}</b>
                        <small className="mt-0.5 block text-[12.5px] leading-snug text-fg-muted">{f.d}</small>
                        <span className="mt-2 flex flex-wrap gap-1.5">
                          {f.tags?.map((t) => (
                            <i key={t} className="rounded-pill bg-white/70 px-2 py-0.5 text-[11px] text-fg-muted not-italic">
                              {t}
                            </i>
                          ))}
                        </span>
                      </span>
                      <FA
                        icon={faArrowRight}
                        className="mt-1 text-[12px] text-fg-subtle transition-transform duration-300 group-hover:translate-x-1"
                        aria-hidden
                      />
                    </Link>
                  ))}
                </div>
              </div>
              <div>
                <div className="mb-3 px-1 text-[11px] font-semibold tracking-[0.1em] text-fg-faint uppercase">The workspace</div>
                <ul className="flex flex-col gap-0.5">
                  {mega.workspace.map((w) => (
                    <li key={w.t}>
                      <Link
                        href={w.href}
                        className="flex items-center gap-3 rounded-r2 p-2.5 transition-colors duration-200 hover:bg-white/70"
                      >
                        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-muted text-[13px] text-fg-muted">
                          <FA icon={w.icon} />
                        </span>
                        <span>
                          <b className="block text-[14px] font-medium text-fg">{w.t}</b>
                          <small className="block text-[12.5px] text-fg-subtle">{w.d}</small>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 px-1 text-[11px] font-semibold tracking-[0.1em] text-fg-faint uppercase">
                  <i className="size-1.5 animate-pulse rounded-full bg-green-fg" aria-hidden />{" "}
                  {kind === "demo" ? "Live preview" : "How it works"}
                </div>
                <MegaPreview key={kind} kind={kind} />
                <Link href="/demo" className="btn btn-primary btn-sm">
                  <FA icon={faPlay} /> Open the product demo
                </Link>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
              <div className="flex flex-wrap gap-1">
                {mega.explore.map((x) => (
                  <Link
                    key={x.href}
                    href={x.href}
                    className="inline-flex items-center gap-2 rounded-pill px-3 py-1.5 text-[13px] text-fg-muted transition-colors hover:bg-white/70 hover:text-fg"
                  >
                    <FA icon={x.icon} className="text-[12px]" />
                    {x.t}
                  </Link>
                ))}
              </div>
              <span className="flex items-center gap-2 text-[12.5px] text-fg-subtle">
                <i className="size-1.5 animate-pulse rounded-full bg-green-fg" aria-hidden /> Gmail &amp; Google Calendar live · more
                integrations soon
              </span>
            </div>
          </div>
        )}
      </div>
      {rest.map((l) => (
        <Link key={l.href} href={l.href} className={linkCls} aria-current={path === l.href ? "page" : undefined}>
          {l.t}
        </Link>
      ))}
    </nav>
  );
}

function MobileMenu({ links }: { links: string[][] }) {
  const [open, setOpen] = useState(false);
  const auth = useAuthState();
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", k);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", k);
    };
  }, [open]);
  const item = "flex items-center justify-between rounded-r2 px-4 py-3.5 text-[17px] text-fg transition-colors hover:bg-white/70";
  return (
    <>
      <button
        type="button"
        className="liquid-bar relative z-[60] grid size-11 place-items-center rounded-full text-[15px] text-fg lg:hidden"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen(!open)}
      >
        {open ? (
          <FA icon={faXmark} />
        ) : (
          <span className="grid gap-[5px]">
            <i className="block h-0.5 w-5 rounded-full bg-fg" />
            <i className="block h-0.5 w-5 rounded-full bg-fg" />
          </span>
        )}
      </button>
      <div
        id="mobile-menu"
        hidden={!open}
        className="fixed inset-0 z-[55] overflow-y-auto bg-page/70 px-4 pt-20 pb-8 backdrop-blur-xl lg:hidden"
      >
        <div className="liquid-menu mx-auto flex max-w-lg animate-glass-in flex-col gap-1 rounded-r4 p-3 motion-reduce:animate-none">
          {links.map(([l, h]) => (
            <Link key={h} href={h} onClick={() => setOpen(false)} className={item}>
              {l}
              <FA icon={faArrowRight} className="text-[12px] text-fg-faint" />
            </Link>
          ))}
          {auth === "out" && (
            <Link href="/login" onClick={() => setOpen(false)} className={item}>
              Log in
            </Link>
          )}
          <AuthLink className="btn btn-primary mt-2" onClick={() => setOpen(false)} />
        </div>
      </div>
    </>
  );
}
