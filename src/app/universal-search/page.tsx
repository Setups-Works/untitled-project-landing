import type { Metadata } from "next";
import { faBolt, faFilter, faLayerGroup, faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import SearchDemo from "../../components/demos/SearchDemo";
import Glass from "../../components/landing/Glass";
import { Kbd, Section, StatusChip, type Status } from "../../components/landing/Kit";
import { R, Reveal } from "../../components/landing/Reveal";
import { CtaPanel, FeatureCards, PageHero, SectionHead } from "../../components/PageKit";

export const metadata: Metadata = {
  title: "Universal Search — untitled project",
  description: "Find anything across your notes, tasks, journal, email, calendar and meetings from one search box.",
};

// Must match docs/CURRENT_STATE.md: search covers tasks, notes, journal and chats today.
const scope: [string, Status][] = [
  ["Tasks", "live"],
  ["Notes", "live"],
  ["Journal", "live"],
  ["Chats", "live"],
  ["Email", "soon"],
  ["Calendar events", "building"],
  ["Meetings", "soon"],
];

export default function Page() {
  return (
    <main>
      <PageHero
        eyebrow="Universal Search"
        status={<StatusChip status="live" />}
        title="Find anything,"
        quiet="wherever it lives."
        lead="One search box for your tasks, notes, journal and chats today, with email, calendar and meetings joining as they arrive. No more guessing which app it was in."
      >
        <a className="btn btn-primary" href="#try" data-cursor="Try it">
          Try the search
        </a>
      </PageHero>

      <Section id="try" tight>
        <Reveal>
          <Glass tone="blue" radius="r5" className="p-[clamp(14px,3vw,36px)]">
            <SearchDemo />
          </Glass>
        </Reveal>
        <p className="mt-4 text-center text-[13.5px] text-fg-subtle">
          A preview with sample data. In the app, press ⌘K (or Ctrl K) from anywhere.
        </p>
      </Section>

      <Section tight>
        <SectionHead
          eyebrow="What it searches"
          title="Honest about"
          quiet="its reach."
          lead="Search works across these today, and the rest are marked so you know."
        />
        <Reveal stagger={0.06} className="mx-auto mt-[clamp(24px,4vw,44px)] grid max-w-3xl gap-3 sm:grid-cols-2">
          {scope.map(([name, status]) => (
            <R key={name}>
              <Glass variant="flat" radius="r3" lift className="flex items-center justify-between px-5 py-4">
                <span className="text-[15.5px] font-medium text-fg">{name}</span>
                <StatusChip status={status} />
              </Glass>
            </R>
          ))}
        </Reveal>
        <p className="mt-6 flex items-center justify-center gap-2 text-[14px] text-fg-muted">
          Open it from anywhere with <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </p>
      </Section>

      <Section tight>
        <SectionHead eyebrow="Why it matters" title="Your work isn’t in one app." quiet="Your search should be." />
        <FeatureCards
          cols={4}
          items={[
            {
              icon: faLayerGroup,
              t: "Everything in one index",
              d: "Tasks, notes, journal entries and chats show up together.",
              tone: "blue",
            },
            {
              icon: faFilter,
              t: "Narrow by type",
              d: "Filter to just notes or just tasks when you know what you’re after.",
              tone: "amber",
            },
            {
              icon: faMagnifyingGlass,
              t: "Context at a glance",
              d: "Results show where each item lives, so you can jump straight to it.",
              tone: "violet",
            },
            {
              icon: faBolt,
              t: "No AI required",
              d: "Search works the same with AI on or off. Your content stays in your workspace.",
              tone: "clay",
            },
          ]}
        />
      </Section>

      <CtaPanel
        title="Stop hunting."
        quiet="Start finding."
        lead="Bring your notes, tasks and journal into one workspace and search them together."
        secondary={["See how it works", "/how-it-works"]}
      />
    </main>
  );
}
