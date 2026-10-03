"use client";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faChevronRight,
  faArrowRight,
  faPlay,
} from "@fortawesome/free-solid-svg-icons";
import { ICONS, isLive } from "../lib/logos";
import type { MegaItem } from "../lib/site";
import MegaPreview from "./MegaPreview";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Children, useEffect, useRef, useState, type ReactNode } from "react";

export function Header({ children }: { children: ReactNode }) {
  const [s, setS] = useState(false);
  useEffect(() => {
    const f = () => setS(window.scrollY > 8);
    f();
    window.addEventListener("scroll", f, { passive: true });
    return () => window.removeEventListener("scroll", f);
  }, []);
  return (
    <header className={`header${s ? " scrolled" : ""}`}>{children}</header>
  );
}

export function Reveal({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.classList.add("in");
          io.disconnect();
        }
      },
      { threshold: 0.01, rootMargin: "0px 0px -40px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`reveal ${className}`}>
      {children}
    </div>
  );
}

type Int = { name: string; use: string };
const FILE: Record<string, string> = {
  Gmail: "gmail.svg",
  "Google Calendar": "google-calendar.svg",
  "Google Meet": "google-meet.svg",
  "Google Drive": "google-drive.svg",
  "Google Sheets": "google-sheets.svg",
  Maps: "maps.svg",
  Outlook: "outlook.svg",
  "Microsoft Teams": "microsoft-teams.svg",
  Slack: "slack.svg",
  Zoom: "zoom.svg",
  Notion: "notion.svg",
  GitHub: "github.svg",
  Linear: "linear.svg",
  Cloudflare: "cloudflare.svg",
  Eventbrite: "eventbrite.png",
};
export function Logo({ name, size = 24 }: { name: string; size?: number }) {
  const f = FILE[name];
  if (f)
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={`/logos/${f}`}
        alt=""
        width={size}
        height={size}
        style={{
          objectFit: "contain",
          flex: "none",
          borderRadius: f.endsWith(".png") ? 6 : 0,
        }}
      />
    );
  const ic = ICONS[name];
  if (ic)
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={ic.hex}
        aria-hidden
        style={{ flex: "none" }}
      >
        <path d={ic.path} />
      </svg>
    );
  return <span style={{ fontWeight: 600 }}>{name[0]}</span>;
}

export function Integrations({
  groups,
}: {
  groups: { name: string; items: Int[] }[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [i, setI] = useState(0);
  const tone = ["", "tone-violet", "tone-blue", "tone-amber", "tone-clay"];
  const go = (n: number) => {
    const el = ref.current;
    if (!el) return;
    const c = Math.max(0, Math.min(groups.length - 1, n));
    const slide = el.children[c] as HTMLElement;
    el.scrollTo({
      left:
        slide.offsetLeft -
        el.offsetLeft -
        parseFloat(getComputedStyle(el).paddingLeft),
      behavior: "smooth",
    });
  };
  const onScroll = () => {
    const el = ref.current;
    if (!el) return;
    const left = el.scrollLeft + parseFloat(getComputedStyle(el).paddingLeft);
    let best = 0,
      d = Infinity;
    Array.from(el.children).forEach((c, n) => {
      const dd = Math.abs((c as HTMLElement).offsetLeft - el.offsetLeft - left);
      if (dd < d) {
        d = dd;
        best = n;
      }
    });
    setI(best);
  };
  return (
    <div className="carousel">
      <div
        className="car-track"
        ref={ref}
        onScroll={onScroll}
        tabIndex={0}
        aria-label="Integration groups"
      >
        {groups.map((g, n) => (
          <div className={`card car-slide ${tone[n]}`} key={g.name}>
            <div
              className="eyebrow"
              style={{ color: "var(--tint-fg, var(--green-fg))" }}
            >
              {g.name}
            </div>
            <div className="ilist">
              {g.items.map((it) => (
                <div className="int" data-soon={!isLive(it.name)} key={it.name}>
                  <div
                    className="tile"
                    style={{ background: "var(--surface-muted)" }}
                  >
                    <Logo name={it.name} size={34} />
                  </div>
                  <div>
                    <div className="card-title" style={{ lineHeight: 1.2 }}>
                      {it.name}
                    </div>
                    {isLive(it.name) ? (
                      <div className="meta">{it.use}</div>
                    ) : (
                      <span className="soon">Coming soon</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="car-ctl">
        <div className="dots">
          {groups.map((g, n) => (
            <button
              key={g.name}
              aria-label={g.name}
              aria-current={n === i}
              onClick={() => go(n)}
            />
          ))}
        </div>
        <div className="arrows">
          <button
            className="arrow"
            aria-label="Previous"
            disabled={i === 0}
            onClick={() => go(i - 1)}
          >
            <FA icon={faChevronLeft} />
          </button>
          <button
            className="arrow"
            aria-label="Next"
            disabled={i === groups.length - 1}
            onClick={() => go(i + 1)}
          >
            <FA icon={faChevronRight} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function AiSwap({ models }: { models: string[] }) {
  const [on, setOn] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setOn((o) => (o + 1) % models.length), 2200);
    return () => clearInterval(t);
  }, [models.length]);
  return (
    <div className="swap">
      <div className="ws">
        <div className="eyebrow" style={{ color: "#5f6055" }}>
          Your workspace
        </div>
        <div className="statement" style={{ marginTop: 10 }}>
          Notes · Tasks
          <br />
          Journal · Email
        </div>
        <div className="meta" style={{ marginTop: 8 }}>
          Stays exactly where it is
        </div>
      </div>
      <div className="link" />
      <div className="models">
        {models.map((m, n) => (
          <button
            key={m}
            className="model"
            data-on={n === on}
            onClick={() => setOn(n)}
          >
            {m}
          </button>
        ))}
      </div>
    </div>
  );
}

export function MobileMenu({ links }: { links: string[][] }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", k);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", k);
    };
  }, [open]);
  return (
    <>
      <button
        className="burger"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen(!open)}
      >
        <span />
        <span />
      </button>
      <div id="mobile-menu" className="mmenu" data-open={open} hidden={!open}>
        {links.map(([l, h]) => (
          <Link key={h} href={h} onClick={() => setOpen(false)}>
            {l}
          </Link>
        ))}
        <Link
          href="/waitlist"
          className="btn btn-primary"
          onClick={() => setOpen(false)}
        >
          Join the waitlist
        </Link>
      </div>
    </>
  );
}

export function CountUp({ to }: { to: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [v, setV] = useState(to);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      return;
    setV(0);
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const t0 = performance.now();
        const step = (t: number) => {
          const p = Math.min(1, (t - t0) / 900);
          setV(Math.round(to * (1 - Math.pow(1 - p, 3))));
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [to]);
  return <span ref={ref}>{v}</span>;
}

export function MobileCarousel({
  children,
  className = "",
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [i, setI] = useState(0);
  const n = Children.count(children);
  const onScroll = () => {
    const el = ref.current;
    if (!el || !el.children[0]) return;
    const w = (el.children[0] as HTMLElement).offsetWidth + 12;
    setI(Math.min(n - 1, Math.round(el.scrollLeft / w)));
  };
  const go = (k: number) => {
    const el = ref.current;
    if (!el || !el.children[0]) return;
    el.scrollTo({
      left: k * ((el.children[0] as HTMLElement).offsetWidth + 12),
      behavior: "smooth",
    });
  };
  return (
    <>
      <div
        ref={ref}
        className={`mcar-track ${className}`}
        style={style}
        onScroll={onScroll}
      >
        {children}
      </div>
      <div className="mcar-dots" aria-hidden={false}>
        {Array.from({ length: n }).map((_, k) => (
          <button
            key={k}
            aria-label={`Go to slide ${k + 1}`}
            aria-current={k === i}
            onClick={() => go(k)}
          />
        ))}
      </div>
    </>
  );
}

export function FaqList({ items }: { items: string[][] }) {
  const [open, setOpen] = useState<number | null>(0);
  const tones = ["violet", "blue", "green", "amber", "clay", "sand"];
  return (
    <div className="faqx">
      {items.map(([q, a], n) => {
        const on = open === n;
        return (
          <div
            className={`faqx-item tone-${tones[n % tones.length]}`}
            data-open={on}
            key={q}
          >
            <h3>
              <button
                aria-expanded={on}
                aria-controls={`faq-${n}`}
                id={`faq-b-${n}`}
                onClick={() => setOpen(on ? null : n)}
              >
                <span className="faqx-n">{String(n + 1).padStart(2, "0")}</span>
                <span className="faqx-q">{q}</span>
                <span className="faqx-plus" aria-hidden>
                  <i />
                  <i />
                </span>
              </button>
            </h3>
            <div
              className="faqx-a"
              id={`faq-${n}`}
              role="region"
              aria-labelledby={`faq-b-${n}`}
            >
              <div>
                <p>{a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Sticky stack items move when stuck, so native #anchor jumps land in the wrong place.
 *  Compute each item's natural (unstuck) position from the container instead. */
export function StackAnchors() {
  useEffect(() => {
    const toId = (a: HTMLAnchorElement | null) => {
      const h = a?.getAttribute("href") ?? "";
      if (h.startsWith("#")) return h.slice(1);
      if (h.startsWith("/#") && window.location.pathname === "/") return h.slice(2);
      return "";
    };
    const jump = (id: string, smooth: boolean) => {
      const target = document.getElementById(id);
      const item = target?.closest(".stack-item") as HTMLElement | null;
      const col = item?.parentElement;
      if (!item || !col) return false;
      if (getComputedStyle(item).position !== "sticky") return false;
      const gap = parseFloat(getComputedStyle(col).rowGap) || 0;
      let y = col.getBoundingClientRect().top + window.scrollY;
      for (const it of Array.from(col.children) as HTMLElement[]) {
        if (it === item) break;
        y += it.offsetHeight + gap;
      }
      const offset = parseFloat(getComputedStyle(item).top) || 80;
      window.scrollTo({ top: y - offset, behavior: smooth ? "smooth" : "auto" });
      return true;
    };
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest("a") as HTMLAnchorElement | null;
      const id = toId(a);
      if (id && jump(id, true)) {
        e.preventDefault();
        history.replaceState(null, "", `#${id}`);
      }
    };
    document.addEventListener("click", onClick);
    const h = window.location.hash.slice(1);
    if (h) setTimeout(() => jump(h, false), 350);
    return () => document.removeEventListener("click", onClick);
  }, []);
  return null;
}

export function NavMenu({
  mega,
  links,
}: {
  mega: { featured: MegaItem[]; workspace: MegaItem[]; explore: MegaItem[] };
  links: { href: string; t: string }[];
}) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState("demo");
  const wrap = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hold = () => { if (timer.current) clearTimeout(timer.current); };
  const show = () => { hold(); setOpen(true); };
  const hide = () => { hold(); timer.current = setTimeout(() => setOpen(false), 140); };
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
  const first = links[0];
  return (
    <nav className="nav" aria-label="Primary">
      <Link href={first.href} aria-current={path === first.href ? "page" : undefined}>{first.t}</Link>
      <div className="navdrop" ref={wrap} onMouseEnter={show} onMouseLeave={hide}>
        <button aria-expanded={open} aria-haspopup="true" aria-controls="mega" data-active={inFeatures} onClick={() => setOpen(!open)}>
          Features <span className="caret" aria-hidden />
        </button>
        {open && (
          <>
            <div className="mega" id="mega" onMouseEnter={show}>
              <div className="mega-in">
                <div className="mega-col">
                  <div className="eyebrow">Features</div>
                  <div className="mega-feat" onMouseLeave={() => setKind("demo")}>
                    {mega.featured.map((f, n) => (
                      <Link
                        key={f.href}
                        href={f.href}
                        className={`mega-card at-${f.tone}`}
                        style={{ ["--d" as string]: `${n * 70}ms` }}
                        aria-current={path === f.href ? "page" : undefined}
                        onMouseEnter={() => setKind(f.kind ?? "demo")}
                        onFocus={() => setKind(f.kind ?? "demo")}
                      >
                        <span className="mega-ico"><FA icon={f.icon} /></span>
                        <span className="mega-txt">
                          <b>{f.t}</b>
                          <small>{f.d}</small>
                          <span className="mega-tags">{f.tags?.map((t) => <i key={t}>{t}</i>)}</span>
                        </span>
                        <span className="mega-go" aria-hidden><FA icon={faArrowRight} /></span>
                      </Link>
                    ))}
                  </div>
                </div>
                <div className="mega-col">
                  <div className="eyebrow">The workspace</div>
                  <ul className="mega-list">
                    {mega.workspace.map((w, n) => (
                      <li key={w.t} style={{ ["--d" as string]: `${120 + n * 45}ms` }}>
                        <Link href={w.href}>
                          <span className="mega-mini"><FA icon={w.icon} /></span>
                          <span><b>{w.t}</b><small>{w.d}</small></span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mega-promo">
                  <div className="mega-live"><span className="live-dot" /> {kind === "demo" ? "Live preview" : "How it works"}</div>
                  <MegaPreview key={kind} kind={kind} />
                  <Link href="/demo" className="btn btn-primary btn-sm"><FA icon={faPlay} /> Open the product demo</Link>
                </div>
              </div>
              <div className="mega-foot">
                <div className="mega-explore">
                  {mega.explore.map((x) => (
                    <Link key={x.href} href={x.href}><FA icon={x.icon} />{x.t}</Link>
                  ))}
                </div>
                <span className="mega-status"><span className="live-dot" /> Gmail &amp; Google Calendar live · more integrations soon</span>
              </div>
            </div>
          </>
        )}
      </div>
      {links.slice(1).map((l) => (
        <Link key={l.href} href={l.href} aria-current={path === l.href ? "page" : undefined}>{l.t}</Link>
      ))}
    </nav>
  );
}
