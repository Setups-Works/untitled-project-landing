import Link from "next/link";
import { FOOTER_COLS, MEGA, MENU, NAV_LINKS } from "../lib/site";
import AuthLink from "./auth/AuthLink";
import Glass from "./landing/Glass";
import { SiteHeaderBar } from "./landing/Nav";
import { WRAP } from "./landing/Kit";
import { BrandMark } from "./BrandMark";

export function SiteHeader() {
  return <SiteHeaderBar mega={MEGA} links={NAV_LINKS} menu={MENU} />;
}

export function SiteFooter() {
  return (
    <footer className="relative pt-[clamp(32px,5vw,72px)] pb-8">
      <div className={WRAP}>
        <Glass radius="r5" className="p-[clamp(24px,4vw,48px)]">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_2fr]">
            <div className="flex flex-col items-start gap-4">
              <Link href="/" className="flex items-center gap-2.5 font-serif text-[27px] tracking-[-0.02em]">
                <BrandMark size={34} />
                untitled project
              </Link>
              <p className="max-w-sm text-[15px] leading-relaxed text-fg-muted">
                One workspace for your notes, tasks, journal, email, calendar and meetings. Your AI can change. Your workspace shouldn’t.
              </p>
              <AuthLink className="btn btn-primary btn-sm" />
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4">
              {FOOTER_COLS.map((c) => (
                <nav key={c.title} aria-label={c.title}>
                  <div className="mb-3 text-[11px] font-semibold tracking-[0.1em] text-fg-faint uppercase">{c.title}</div>
                  <ul className="flex flex-col gap-2">
                    {c.links.map(([l, h]) => (
                      <li key={l}>
                        <Link href={h} className="text-[14.5px] text-fg-muted transition-colors hover:text-fg">
                          {l}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>
              ))}
            </div>
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5 text-[13px] text-fg-subtle">
            <span>© {new Date().getFullYear()} untitled project. All rights reserved.</span>
            <span className="flex items-center gap-2.5">
              <span className="text-[11px] font-semibold tracking-[0.1em] text-fg-faint uppercase">Backed by</span>
              <span className="font-medium text-fg">Setups Works</span>
              <span lang="ta" className="font-sans text-fg-muted">
                செட்டப்ஸ் வொர்க்ஸ்
              </span>
            </span>
          </div>
        </Glass>
      </div>
    </footer>
  );
}
