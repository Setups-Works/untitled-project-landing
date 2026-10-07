import type { Metadata } from "next";
import Link from "next/link";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faFileImport,
  faPlug,
  faLayerGroup,
  faWandMagicSparkles,
  faPenToSquare,
  faEnvelope,
  faCalendarDays,
  faKey,
} from "@fortawesome/free-solid-svg-icons";
import { PageHero, SectionHead, FeatureCards, CtaPanel } from "../../components/PageKit";
import { Reveal } from "../../components/Client";

export const metadata: Metadata = {
  title: "How it works — untitled project",
  description: "One workspace for notes, tasks, journal, email, calendar and meetings — with AI that you choose, or no AI at all.",
};

const steps = [
  {
    icon: faFileImport,
    tone: "violet",
    t: "Bring your work in",
    d: "Start with notes, tasks and a journal. Import what you already have, clip the web as you browse, and take it all with you whenever you need to.",
    pts: ["Rich notes with tables and backlinks", "Import + export", "Web clipper"],
  },
  {
    icon: faPlug,
    tone: "blue",
    t: "Connect your tools",
    d: "Connect Gmail and Google Calendar so the conversations and plans that matter live next to your notes — not in separate apps.",
    pts: ["Gmail and Google Calendar today", "More integrations coming soon", "Multiple accounts with Pro"],
  },
  {
    icon: faLayerGroup,
    tone: "amber",
    t: "Work in one place",
    d: "Read threads, plan your week, capture meetings and follow through — with the context kept together instead of scattered.",
    pts: ["Email, calendar and meetings side by side", "To-do next to the work", "Automations for the repetitive parts"],
  },
  {
    icon: faWandMagicSparkles,
    tone: "green",
    t: "Add AI only if you want it",
    d: "Use a supported AI account, bring your own API key, or top up only when you need it. Or keep the workspace fully AI-free. Switch any time.",
    pts: ["Bring your own API key", "Pay for usage when you need it", "AI-free mode, always available"],
  },
];

export default function Page() {
  return (
    <main>
      <PageHero
        eyebrow="How it works"
        title="One workspace."
        quiet="Any AI, or none."
        lead="untitled project brings your notes, tasks, journal, email, calendar and meetings together — and keeps all of it separate from whichever AI you choose to use."
      >
        <Link className="btn btn-primary" href="/demo">
          Try the product demo <FA icon={faArrowRight} />
        </Link>
        <Link className="btn btn-secondary" href="/pricing">
          See pricing
        </Link>
      </PageHero>

      <section className="section">
        <div className="container">
          <SectionHead eyebrow="In four steps" title="From scattered apps" quiet="to one calm place." />
          <div className="steps">
            {steps.map((s, n) => (
              <Reveal key={s.t}>
                <div className={`step at-${s.tone}`}>
                  <div className="step-n">{String(n + 1).padStart(2, "0")}</div>
                  <div className="step-ico">
                    <FA icon={s.icon} />
                  </div>
                  <h3 className="h3">{s.t}</h3>
                  <p className="body">{s.d}</p>
                  <ul className="step-pts">
                    {s.pts.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <Reveal>
            <div className="panel" data-tone="dark">
              <div className="center stack">
                <div className="eyebrow" style={{ color: "#f4f3e999" }}>
                  The principle
                </div>
                <h2 className="h2">
                  Your AI can change. <span className="quiet">Your workspace shouldn’t.</span>
                </h2>
                <p className="lead">
                  Try a new model. Switch providers. Change what powers your AI. Your notes, tasks, journal and everything you’ve built stay
                  exactly where they are.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <SectionHead eyebrow="What you get" title="Everything a day needs," quiet="in one flow." />
          <FeatureCards
            items={[
              {
                icon: faPenToSquare,
                t: "Think and write",
                d: "Notes, tables and a journal that connect to each other.",
                tone: "tone-blue",
              },
              {
                icon: faEnvelope,
                t: "Read and reply",
                d: "Full email threads with compose, reply, forward and attachments.",
                tone: "tone-clay",
              },
              { icon: faCalendarDays, t: "Plan your time", d: "One view of work and personal schedules.", tone: "tone-amber" },
              { icon: faKey, t: "Choose your AI", d: "Bring your own key, pay as you go, or use none.", tone: "tone-violet" },
            ]}
            cols={4}
          />
        </div>
      </section>

      <CtaPanel
        title="See it"
        quiet="in action."
        lead="Click around a working preview of the workspace — no sign-up needed."
        primary={["Open the product demo", "/demo"]}
        secondary={["Read the FAQ", "/#faq"]}
      />
    </main>
  );
}
