import type { Metadata } from "next";
import Link from "next/link";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faBookOpen,
  faCalendarDays,
  faComments,
  faFileImport,
  faKey,
  faLayerGroup,
  faListCheck,
  faMagnifyingGlass,
  faPenToSquare,
  faPlug,
  faWandMagicSparkles,
} from "@fortawesome/free-solid-svg-icons";
import { CtaPanel, FeatureCards, PageHero, SectionHead } from "../../components/PageKit";
import { DayTimeline, StepCards } from "../../components/landing/Blocks";
import Glass from "../../components/landing/Glass";
import { Eyebrow, Lead, Section, Title } from "../../components/landing/Kit";
import { Reveal } from "../../components/landing/Reveal";

export const metadata: Metadata = {
  title: "How it works — untitled project",
  description:
    "One workspace for notes, tasks, journal, calendar and chat, with email and meetings on the way. AI that you choose, or no AI at all.",
};

const steps = [
  {
    icon: faFileImport,
    tone: "violet",
    t: "Bring your work in",
    d: "Start with notes, tasks and a journal. Import what you already have, and take it all with you whenever you need to.",
    pts: ["Rich notes with slash commands and voice", "Import and export", "Everything stays yours"],
  },
  {
    icon: faPlug,
    tone: "blue",
    t: "Connect your tools",
    d: "Connect Gmail and Google Calendar so the conversations and plans that matter live next to your notes, not in separate apps.",
    pts: ["Google connections are the first to arrive", "More integrations coming soon", "Multiple accounts with Pro"],
  },
  {
    icon: faLayerGroup,
    tone: "amber",
    t: "Work in one place",
    d: "Plan your week, tick off tasks, keep a journal and search it all together, with the context kept in one place instead of scattered.",
    pts: ["Tasks on the calendar", "One search across everything", "Email, meetings and automations on the way"],
  },
  {
    icon: faWandMagicSparkles,
    tone: "green",
    t: "Add AI only if you want it",
    d: "Use a supported AI account, bring your own API key, or top up only when you need it. Or keep the workspace fully AI-free. Switch any time.",
    pts: ["Bring your own API key", "Pay for usage when you need it", "AI-free mode, always available"],
  },
] as const;

const day = [
  {
    time: "8:00",
    icon: faCalendarDays,
    tone: "green",
    t: "See the day",
    d: "Open Home for today’s tasks, and the calendar for what is on.",
  },
  {
    time: "11:30",
    icon: faListCheck,
    tone: "amber",
    t: "Capture without breaking flow",
    d: "Press Q to add a task, or speak a note instead of typing it.",
  },
  {
    time: "15:00",
    icon: faMagnifyingGlass,
    tone: "gold",
    t: "Find the thing",
    d: "Press ⌘K and search tasks, notes, journal and chats at once.",
  },
  {
    time: "21:00",
    icon: faBookOpen,
    tone: "violet",
    t: "Close the day",
    d: "Write a journal entry, privately, and let tomorrow’s tasks wait their turn.",
  },
] as const;

export default function Page() {
  return (
    <main>
      <PageHero
        eyebrow="How it works"
        title="One workspace."
        quiet="Any AI, or none."
        lead="untitled project brings your notes, tasks, journal, calendar and chat together, with email and meetings on the way, and keeps all of it separate from whichever AI you choose to use."
      >
        <Link className="btn btn-primary" href="/demo" data-cursor="Play">
          Try the product demo <FA icon={faArrowRight} />
        </Link>
        <Link className="btn btn-secondary" href="/pricing">
          See pricing
        </Link>
      </PageHero>

      <Section tight>
        <SectionHead eyebrow="In four steps" title="From scattered apps" quiet="to one calm place." />
        <StepCards steps={steps} />
      </Section>

      <Section tight>
        <SectionHead
          eyebrow="A day with it"
          title="What a day"
          quiet="looks like."
          lead="No grand routine required. Here is how the pieces fit into an ordinary day."
        />
        <DayTimeline moments={day} />
      </Section>

      <Section tight>
        <Reveal>
          <Glass variant="dark" radius="r5" className="overflow-hidden px-6 py-[clamp(40px,6vw,80px)] text-center">
            <span
              aria-hidden
              className="pointer-events-none absolute -top-20 left-1/2 -z-10 size-[380px] -translate-x-1/2 rounded-full bg-violet-fg/35 blur-[90px]"
            />
            <div className="mx-auto flex max-w-2xl flex-col items-center gap-5">
              <Eyebrow dark>The principle</Eyebrow>
              <Title dark quiet="Your workspace shouldn’t.">
                Your AI can change.
              </Title>
              <Lead dark className="mx-auto">
                Try a new model. Switch providers. Change what powers your AI. Your notes, tasks, journal and everything you’ve built stay
                exactly where they are.
              </Lead>
            </div>
          </Glass>
        </Reveal>
      </Section>

      <Section tight>
        <SectionHead eyebrow="What you get" title="Everything a day needs," quiet="in one flow." />
        <FeatureCards
          cols={4}
          items={[
            { icon: faPenToSquare, t: "Think and write", d: "Notes and a private journal, with voice and attachments.", tone: "blue" },
            {
              icon: faListCheck,
              t: "Plan and do",
              d: "Tasks with priorities and repeats, on a calendar you can read at a glance.",
              tone: "amber",
            },
            { icon: faComments, t: "Ask, with your OK", d: "An assistant that drafts things and waits for you to confirm.", tone: "mint" },
            { icon: faKey, t: "Choose your AI", d: "Bring your own key, pay as you go, or use none.", tone: "violet" },
          ]}
        />
      </Section>

      <CtaPanel
        title="See it"
        quiet="in action."
        lead="Click around a working preview of the workspace. No sign-up needed."
        primary={["Open the product demo", "/demo"]}
        secondary={["Read the FAQ", "/#faq"]}
      />
    </main>
  );
}
