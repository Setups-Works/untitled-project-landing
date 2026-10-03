import Link from "next/link";
import { Header, MobileMenu, NavMenu, StackAnchors } from "./Client";
import { FEATURES, FOOTER_COLS, MENU, NAV_LINKS } from "../lib/site";

export function SiteHeader() {
  return (
    <>
      <StackAnchors />
      <Header>
        <div className="container row">
          <Link href="/" className="logo">
            <i />
            untitled project
          </Link>
          <NavMenu features={FEATURES} links={NAV_LINKS} />
          <Link href="/#start" className="btn btn-primary btn-sm hide-sm">
            Get started
          </Link>
          <MobileMenu links={MENU} />
        </div>
      </Header>
    </>
  );
}

export function SiteFooter() {
  return (
    <footer className="sfoot">
      <div className="container">
        <div className="sfoot-top">
          <div className="sfoot-brand">
            <Link href="/" className="logo">
              <i />
              untitled project
            </Link>
            <p className="body">
              One workspace for your notes, tasks, journal, email, calendar and
              meetings. Your AI can change. Your workspace shouldn’t.
            </p>
            <Link href="/#start" className="btn btn-primary btn-sm">
              Get started
            </Link>
          </div>
          <div className="sfoot-cols">
            {FOOTER_COLS.map((c) => (
              <nav key={c.title} aria-label={c.title}>
                <div className="eyebrow">{c.title}</div>
                <ul>
                  {c.links.map(([l, h]) => (
                    <li key={l}>
                      <Link href={h}>{l}</Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>
        <div className="sfoot-bottom">
          <span className="meta">
            © {new Date().getFullYear()} untitled project. All rights reserved.
          </span>
          <span className="footer-back" style={{ margin: 0, padding: 0, border: 0 }}>
            <span className="eyebrow">Backed by</span>
            <span className="footer-brand">Setups Works</span>
            <span className="footer-ta" lang="ta">
              செட்டப்ஸ் வொர்க்ஸ்
            </span>
          </span>
        </div>
      </div>
    </footer>
  );
}
