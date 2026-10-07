import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faBan,
  faBookOpen,
  faCalendarDays,
  faCheck,
  faClockRotateLeft,
  faDiagramProject,
  faEnvelope,
  faHouse,
  faKey,
  faLink,
  faListCheck,
  faLock,
  faMicrophone,
  faPenToSquare,
  faPlug,
  faPlus,
  faRightLeft,
  faScissors,
  faTable,
  faTableColumns,
  faWallet,
  faWandMagicSparkles,
} from "@fortawesome/free-solid-svg-icons";
import {
  Reveal,
  Integrations,
  Logo,
  CountUp,
  MobileCarousel,
  FaqList,
} from "../components/Client";
import AiSwitcher from "../components/AiSwitcher";
import HeroApp from "../components/HeroApp";
import { isLive } from "../lib/logos";
import Areas from "../components/Areas";
import AuthLink from "../components/auth/AuthLink";


const noteFeats = [
  [
    faPenToSquare,
    "Rich notes",
    "Write, organize, and structure things your way.",
  ],
  [
    faTable,
    "Tables",
    "Turn notes into something more useful with formulas and linked columns.",
  ],
  [
    faLink,
    "Backlinks + Atlas",
    "See the connections between your ideas and notes.",
  ],
  [
    faClockRotateLeft,
    "Version history",
    "Go back to an earlier version whenever you need to.",
  ],
  [faScissors, "Web clipper", "Save what matters while you browse."],
  [
    faRightLeft,
    "Import + export",
    "Bring your existing work with you and take it with you when you need to.",
  ],
] as const;

const journalFeats = [
  [
    faBookOpen,
    "A record of your days",
    "Capture what happened, what you thought and what comes next.",
  ],
  [
    faLock,
    "Private by design",
    "Your journal is yours — a private place, separate from the rest of the workspace.",
  ],
  [
    faLink,
    "Connected to your notes",
    "Link entries to notes and ideas so nothing sits in isolation.",
  ],
  [
    faCalendarDays,
    "Context from your calendar",
    "Keep meetings and plans alongside what you wrote about them.",
  ],
  [
    faListCheck,
    "Plan next to the work",
    "Turn reflections into to-dos without leaving the page.",
  ],
  [
    faWandMagicSparkles,
    "AI only if you want it",
    "Use AI when it helps. Ignore it when it doesn't.",
  ],
] as const;

const groups = [
  {
    name: "Communication",
    items: [
      { name: "Gmail", use: "Fetch & send mail" },
      { name: "Outlook", use: "Draft follow-ups" },
      { name: "Slack", use: "Send recaps" },
    ],
  },
  {
    name: "Calendar & meetings",
    items: [
      { name: "Google Calendar", use: "Sync events" },
      { name: "Google Meet", use: "Meetings" },
      { name: "Microsoft Teams", use: "Meetings" },
      { name: "Zoom", use: "Meetings" },
    ],
  },
  {
    name: "Data",
    items: [
      { name: "Google Drive", use: "Backup files" },
      { name: "Google Docs", use: "Documents" },
      { name: "Google Sheets", use: "Answer from data" },
      { name: "Notion", use: "Import notes" },
    ],
  },
  {
    name: "Work",
    items: [
      { name: "GitHub", use: "Track issues" },
      { name: "Linear", use: "Move tickets" },
      { name: "HubSpot", use: "Log CRM activity" },
    ],
  },
  {
    name: "More",
    items: [
      { name: "Cloudflare", use: "Watch your sites" },
      { name: "Eventbrite", use: "Manage events" },
      { name: "Maps", use: "Location workflows" },
      { name: "Other supported connections", use: "And more" },
    ],
  },
];
const allInts = groups
  .flatMap((g) => g.items.map((x) => x.name))
  .filter((n) => !n.startsWith("Other"));

const faqs = [
  [
    "Do I have to use AI?",
    "No. Use AI when it helps, or keep your workspace fully AI-free. The workspace works the same either way.",
  ],
  [
    "What happens if I switch AI provider or model?",
    "Nothing happens to your content. Your notes, tasks, journal and everything you've built stay exactly where they are — the workspace is separate from the AI you choose.",
  ],
  [
    "Which email and calendar services can I connect?",
    "Gmail and Outlook for email, Google Calendar for events. With Pro you can connect up to 5 email accounts and up to 5 calendars.",
  ],
  [
    "Can I bring my existing notes?",
    "Yes. Import your existing work (including from Notion), and export it whenever you need to take it with you.",
  ],
  [
    "Does it connect to the tools my team already uses?",
    "Yes — Slack, Google Drive, Docs and Sheets, Notion, GitHub, Linear, HubSpot, Zoom, Google Meet and Microsoft Teams, plus Cloudflare, Eventbrite and Maps. There is also an option for other supported connections.",
  ],
  [
    "How do I pay for AI?",
    "Bring your own API key, connect an AI account you already have, or top up only when you need AI. There's no bundled AI subscription.",
  ],
];

const Check_ = () => <FA icon={faCheck} aria-hidden />;

export default function Page() {
  return (
    <>
      <main>
        {/* HERO */}
        <section className="hero">
          <div className="aurora" aria-hidden />
          <div className="container inner">
            <div className="chip" style={{ marginBottom: 24 }}>
              <FA icon={faWandMagicSparkles} style={{ color: "#1f5d49" }} />
              Your AI can change. Your workspace shouldn’t.
            </div>
            <h1 className="display" style={{ maxWidth: 940, margin: "0 auto" }}>
              One workspace for everything you{" "}
              <span className="quiet">think, plan and send.</span>
            </h1>
            <p className="lead" style={{ margin: "22px auto 0" }}>
              Notes, tasks, journal, email, calendar, meetings and automations —
              together in one place. Use AI when it helps. Ignore it when it
              doesn’t.
            </p>
            <div className="cta" id="start">
              <AuthLink arrow />
              <a className="btn btn-secondary" href="#notes">
                See what’s inside
              </a>
            </div>

            <div className="hero-mock">
              <HeroApp />
            </div>
          </div>
        </section>

        {/* MARQUEE */}
        <section style={{ padding: "48px 0 0" }} aria-label="Integrations">
          <div className="marquee">
            <div className="marquee-track">
              {[...allInts, ...allInts].map((n, k) => (
                <span className="chip" data-soon={!isLive(n)} key={k}>
                  <Logo name={n} size={18} />
                  {n}
                  {!isLive(n) && <em className="soon-tag">Soon</em>}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* AREAS */}
        <section className="section" id="areas">
          <div className="container">
            <Reveal className="center stack">
              <div className="eyebrow">The workspace</div>
              <h2 className="h2">
                Everything in one place,{" "}
                <span className="quiet">nothing in isolation.</span>
              </h2>
              <p className="lead">
                Connect external services instead of managing information in
                isolated apps.
              </p>
            </Reveal>
            <Reveal>
              <Areas />
            </Reveal>
          </div>
        </section>

        {/* SCROLL STACK: Journal → Notes → Email → Calendar → Integrations */}
        <section className="section stackwrap" style={{ paddingTop: 0 }}>
          <div className="container">
            <Reveal className="center stack stack-head">
              <div className="eyebrow">Inside the workspace</div>
              <h2 className="h2">
                Write it down, plan it,{" "}
                <span className="quiet">send it — in one flow.</span>
              </h2>
              <p className="lead">
                Journal, notes, email and calendar are built to work together,
                so the context follows you from one to the next.
              </p>
            </Reveal>
          </div>
          <div className="container stackcol">
            <div
              className="stack-item"
              id="journal"
              style={{ ["--i" as string]: 0 }}
            >
              <div className="panel" data-tone="violet">
                <div className="center stack">
                  <div className="eyebrow">Journal</div>
                  <h2 className="h2">
                    Your days. <span className="quiet">Your record.</span>
                  </h2>
                  <p className="lead">
                    A private record of your days. Write it down, come back to
                    it later, and keep it close to the work.
                  </p>
                </div>
                <MobileCarousel className="grid g3" style={{ marginTop: 48 }}>
                  {journalFeats.map(([I, t, d]) => (
                    <div className="card" key={t}>
                      <div className="tile">
                        <FA icon={I} />
                      </div>
                      <div className="card-title" style={{ marginTop: 6 }}>
                        {t}
                      </div>
                      <p className="body">{d}</p>
                    </div>
                  ))}
                </MobileCarousel>
              </div>
            </div>
            <div
              className="stack-item"
              id="notes"
              style={{ ["--i" as string]: 1 }}
            >
              <div className="panel" data-tone="blue">
                <div className="center stack">
                  <div className="eyebrow">Notes</div>
                  <h2 className="h2">
                    Your notes. <span className="quiet">Your way.</span>
                  </h2>
                  <p className="lead">
                    Write. Organize. Connect. Come back to it later. Use AI when
                    it helps. Ignore it when it doesn’t.
                  </p>
                </div>
                <MobileCarousel className="grid g3" style={{ marginTop: 48 }}>
                  {noteFeats.map(([I, t, d]) => (
                    <div className="card" key={t}>
                      <div className="tile">
                        <FA icon={I} />
                      </div>
                      <div className="card-title" style={{ marginTop: 6 }}>
                        {t}
                      </div>
                      <p className="body">{d}</p>
                    </div>
                  ))}
                </MobileCarousel>
              </div>
            </div>
            <div className="stack-item" style={{ ["--i" as string]: 2 }}>
              <div className="panel split" id="email" data-tone="accent">
                <MobileCarousel className="split-inner">
                  <div className="stack">
                    <div className="eyebrow">Email</div>
                    <h2 className="h2">
                      Your email,{" "}
                      <span className="quiet">fully connected.</span>
                    </h2>
                    <p className="lead">
                      Connect Gmail or Outlook and bring the conversations that
                      matter into untitled project.
                    </p>
                    <ul className="feat-list">
                      {[
                        "Read complete threads",
                        "Compose, reply and reply all",
                        "Forward",
                        "Work with attachments",
                        "Keep the full context together",
                      ].map((x) => (
                        <li key={x}>
                          <Check_ />
                          {x}
                        </li>
                      ))}
                    </ul>
                    <p className="body">
                      <strong style={{ color: "var(--fg)" }}>
                        Multiple accounts? No problem.
                      </strong>{" "}
                      With Pro, connect up to 5 email accounts and manage them
                      all from one place.
                    </p>
                  </div>
                  <div className="card" data-emphasis style={{ gap: 0 }}>
                    <div className="eyebrow" style={{ marginBottom: 12 }}>
                      Thread · 4 messages
                    </div>
                    <div className="card-title" style={{ fontSize: 17 }}>
                      Re: Q3 roadmap review
                    </div>
                    {[
                      [
                        "Maya",
                        "Gmail",
                        "Shared the draft — thoughts on scope?",
                      ],
                      [
                        "You",
                        "Outlook",
                        "Looks good. Attaching the revised timeline.",
                      ],
                      ["Dev", "Gmail", "Can we move the review to Thursday?"],
                    ].map(([n, a, m]) => (
                      <div
                        key={n + m}
                        style={{
                          padding: "12px 0",
                          borderTop: "1px solid var(--line)",
                          marginTop: 12,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <span className="card-title">{n}</span>
                          <span
                            className="chip"
                            style={{ padding: "3px 10px", fontSize: 11.5 }}
                          >
                            {a}
                          </span>
                        </div>
                        <p className="body" style={{ marginTop: 4 }}>
                          {m}
                        </p>
                      </div>
                    ))}
                    <div className="pillrow" style={{ marginTop: 14 }}>
                      <span className="chip">Reply</span>
                      <span className="chip">Reply all</span>
                      <span className="chip">Forward</span>
                    </div>
                  </div>
                </MobileCarousel>
              </div>
            </div>
            <div className="stack-item" style={{ ["--i" as string]: 3 }}>
              <div className="panel split" id="calendar" data-tone="amber">
                <MobileCarousel className="split-inner">
                  <div className="card" style={{ order: 0, gap: 8 }}>
                    <div className="eyebrow">This week · Work + Personal</div>
                    {[
                      ["Mon", "Planning", "green"],
                      ["Tue", "1:1 with Sam", "amber"],
                      ["Wed", "Gym", "violet"],
                      ["Thu", "Launch review", "green"],
                      ["Fri", "Team lunch", "clay"],
                    ].map(([d, e, c]) => (
                      <div
                        key={d}
                        style={{
                          display: "flex",
                          gap: 14,
                          alignItems: "center",
                          padding: "8px 0",
                          borderTop: "1px solid var(--line)",
                        }}
                      >
                        <span className="meta" style={{ width: 32 }}>
                          {d}
                        </span>
                        <span
                          className="ev"
                          style={{
                            flex: 1,
                            margin: 0,
                            background: `var(--${c}-bg)`,
                            color: `var(--${c}-fg)`,
                          }}
                        >
                          {e}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="stack">
                    <div className="eyebrow">Calendar</div>
                    <h2 className="h2">
                      One view of where your{" "}
                      <span className="quiet">time is going.</span>
                    </h2>
                    <p className="lead">
                      Connect your calendar and keep meetings, plans, reminders
                      and the context around them together.
                    </p>
                    <ul className="feat-list">
                      {[
                        "Sync events",
                        "Unified schedule view",
                        "Work and personal in one place",
                        "Multiple calendars",
                      ].map((x) => (
                        <li key={x}>
                          <Check_ />
                          {x}
                        </li>
                      ))}
                    </ul>
                    <p className="body">
                      Pro supports up to 5 calendars, so work and personal
                      schedules don’t have to live in separate worlds.
                    </p>
                  </div>
                </MobileCarousel>
              </div>
            </div>
            <div
              className="stack-item"
              id="integrations"
              style={{ ["--i" as string]: 4 }}
            >
              <div className="panel" data-tone="clay">
                <div className="center stack">
                  <div className="eyebrow">Integrations</div>
                  <h2 className="h2">
                    Connect the tools{" "}
                    <span className="quiet">you already use.</span>
                  </h2>
                  <p className="lead">
                    From inbox to issue tracker — and an extensible model for
                    the rest.
                  </p>
                </div>
                <Integrations groups={groups} />
              </div>
            </div>
          </div>
        </section>

        {/* AI */}
        <section className="section" id="ai" style={{ paddingTop: 0 }}>
          <div className="container">
            <Reveal>
              <div className="panel ai-panel" data-tone="dark">
                <div className="ai-copy stack">
                  <div className="eyebrow" style={{ color: "#f4f3e999" }}>
                    AI, on your terms
                  </div>
                  <h2 className="h2">
                    Your AI can change.{" "}
                    <span className="quiet">Your workspace shouldn’t.</span>
                  </h2>
                  <p className="lead">
                    Try a new model. Switch providers. Change what powers your
                    AI. Your notes, tasks, journal, and everything you’ve built
                    stay exactly where they are.
                  </p>
                  <ul className="ai-points">
                    <li>
                      <FA icon={faCheck} />
                      Provider independence
                    </li>
                    <li>
                      <FA icon={faCheck} />
                      Bring your own API key
                    </li>
                    <li>
                      <FA icon={faCheck} />
                      Pay only when you use it
                    </li>
                    <li>
                      <FA icon={faCheck} />
                      AI-free mode, always available
                    </li>
                  </ul>
                </div>
                <AiSwitcher />
              </div>
            </Reveal>
          </div>
        </section>

        {/* PRO */}
        <section className="section" id="pro" style={{ paddingTop: 0 }}>
          <div className="container">
            <Reveal className="center stack">
              <div className="eyebrow">Pro</div>
              <h2 className="h2">
                Room for every inbox,{" "}
                <span className="quiet">every calendar.</span>
              </h2>
              <p className="lead">
                Work and personal don’t have to live in separate worlds. Go
                further with Pro — and never pay for AI you don’t use.
              </p>
            </Reveal>
            <Reveal>
              <MobileCarousel className="stats">
                {[
                  {
                    n: 5,
                    up: true,
                    tone: "violet",
                    icon: faEnvelope,
                    t: "Email accounts",
                    d: "Connect up to 5 Gmail or Outlook accounts and manage them all from one place.",
                    chips: ["Gmail", "Outlook"],
                  },
                  {
                    n: 5,
                    up: true,
                    tone: "amber",
                    icon: faCalendarDays,
                    t: "Calendars",
                    d: "Keep work and personal schedules together in one unified view of your time.",
                    chips: ["Google Calendar"],
                  },
                  {
                    n: 0,
                    tone: "green",
                    icon: faBan,
                    t: "Bundled AI subscriptions",
                    d: "Bring your own key or top up only when you need AI. Or keep the workspace AI-free.",
                    chips: ["BYOK", "Pay as you go", "AI-free"],
                  },
                ].map((x) => (
                  <div className={`stat tone-${x.tone}`} key={x.t}>
                    <div className="stat-top">
                      <div className="tile">
                        <FA icon={x.icon} />
                      </div>
                      {x.up && <span className="stat-up">Up to</span>}
                    </div>
                    <div className="figure">
                      <CountUp to={x.n} />
                    </div>
                    <div className="stat-title">{x.t}</div>
                    <p className="body">{x.d}</p>
                    <div className="pillrow" style={{ marginTop: "auto" }}>
                      {x.chips.map((c) => (
                        <span className="chip" key={c}>
                          {["Gmail", "Outlook", "Google Calendar"].includes(
                            c,
                          ) && <Logo name={c} size={16} />}
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </MobileCarousel>
            </Reveal>
            <Reveal>
              <ul className="stat-strip">
                {[
                  "Multiple email accounts",
                  "Multiple calendars",
                  "Switch AI providers anytime",
                  "Your workspace stays put",
                ].map((x) => (
                  <li key={x}>
                    <FA icon={faCheck} />
                    {x}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </section>

        {/* FAQ */}
        <section className="section" id="faq" style={{ paddingTop: 0 }}>
          <div className="container faq-grid">
            <Reveal className="faq-side">
              <div className="eyebrow">FAQ</div>
              <h2 className="h2" style={{ marginTop: 14 }}>
                Good <span className="quiet">questions.</span>
              </h2>
              <p className="lead" style={{ marginTop: 16 }}>
                Quick answers about AI, accounts and your data. Still unsure?
                Start with the notes and connect the rest later.
              </p>
              <div className="faq-help">
                <div className="tile">
                  <FA icon={faWandMagicSparkles} />
                </div>
                <div>
                  <div className="card-title">Your workspace, your rules</div>
                  <p className="body" style={{ marginTop: 4 }}>
                    Use AI when it helps. Ignore it when it doesn’t.
                  </p>
                </div>
              </div>
              <AuthLink arrow style={{ marginTop: 22 }} />
            </Reveal>
            <Reveal>
              <FaqList items={faqs} />
            </Reveal>
          </div>
        </section>

        {/* CTA */}
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="container">
            <Reveal>
              <div className="panel center stack" data-tone="forest">
                <h2 className="h2">
                  Bring it all <span className="quiet">together.</span>
                </h2>
                <p className="lead">
                  One workspace for personal and work information. Start with
                  the notes — connect the rest when you’re ready.
                </p>
                <div
                  className="cta"
                  style={{
                    display: "flex",
                    gap: 12,
                    justifyContent: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <AuthLink arrow />
                  <a className="btn btn-secondary" href="#integrations">
                    Browse integrations
                  </a>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

    </>
  );
}
