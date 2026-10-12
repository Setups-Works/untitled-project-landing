import type { Metadata } from "next";
import { faBookOpen, faCalendarDays, faEnvelope, faListCheck } from "@fortawesome/free-solid-svg-icons";
import BriefDemo from "../../components/demos/BriefDemo";
import Glass from "../../components/landing/Glass";
import { Eyebrow, Lead, Section, StatusChip, Title } from "../../components/landing/Kit";
import { Reveal } from "../../components/landing/Reveal";
import { CtaPanel, FeatureCards, PageHero, SectionHead } from "../../components/PageKit";

export const metadata: Metadata = {
  title: "Daily Brief — untitled project",
  description: "Start the day knowing what matters: your events, tasks, email and journal in one brief, with or without AI.",
};

export default function Page() {
  return (
    <main>
      <PageHero
        eyebrow="Daily Brief"
        status={<StatusChip status="building" />}
        title="Start the day"
        quiet="knowing what matters."
        lead="Your events, open tasks, email that needs a reply and a line from your journal, pulled into one calm page. Turn the AI summary on or off; the brief works either way."
      >
        <a className="btn btn-primary" href="#brief" data-cursor="Preview">
          See a sample brief
        </a>
      </PageHero>

      <Section id="brief" tight>
        <Reveal>
          <Glass tone="amber" radius="r5" className="p-[clamp(14px,3vw,36px)]">
            <BriefDemo />
          </Glass>
        </Reveal>
        <p className="mt-4 text-center text-[13.5px] text-fg-subtle">
          A sample with made-up content. The Daily Brief is being built; your tasks and calendar are the first sources.
        </p>
      </Section>

      <Section tight>
        <SectionHead eyebrow="What’s inside" title="Four sources," quiet="one page." />
        <FeatureCards
          cols={4}
          items={[
            { icon: faCalendarDays, t: "Your calendar", d: "Today’s events across your calendars.", tone: "amber" },
            { icon: faListCheck, t: "Your tasks", d: "What’s open and what’s next, taken from your to-do lists.", tone: "blue" },
            { icon: faEnvelope, t: "Your email", d: "Threads that are waiting on you. Arrives with email support.", tone: "clay" },
            { icon: faBookOpen, t: "Your journal", d: "A line from your own days to ground you before you start.", tone: "violet" },
          ]}
        />
      </Section>

      <Section tight>
        <Reveal>
          <Glass tone="green" radius="r5" className="p-[clamp(24px,5vw,64px)]">
            <div className="mx-auto flex max-w-2xl flex-col items-center gap-5 text-center">
              <Eyebrow>AI optional</Eyebrow>
              <Title quiet="Plain facts when you don’t.">Summaries when you want them.</Title>
              <Lead className="mx-auto">
                With an AI provider connected, your brief can open with a short summary. Without one, you get the same information as a
                clean list. Either way, your content stays in your workspace.
              </Lead>
            </div>
          </Glass>
        </Reveal>
      </Section>

      <CtaPanel
        title="Make mornings"
        quiet="calmer."
        lead="Start with your tasks and calendar, and let the day arrange itself on one page."
        secondary={["See how it works", "/how-it-works"]}
      />
    </main>
  );
}
