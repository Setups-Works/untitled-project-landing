import type { Metadata } from "next";
import { faCalendarDays, faListCheck, faEnvelope, faBookOpen, faToggleOn } from "@fortawesome/free-solid-svg-icons";
import { PageHero, SectionHead, FeatureCards, CtaPanel } from "../../components/PageKit";
import BriefDemo from "../../components/demos/BriefDemo";
import { Reveal } from "../../components/Client";

export const metadata: Metadata = {
  title: "Daily Brief — untitled project",
  description: "Start the day knowing what matters: your events, tasks, email and journal in one brief — with or without AI.",
};

export default function Page() {
  return (
    <main>
      <PageHero eyebrow="Daily Brief" title="Start the day" quiet="knowing what matters." lead="Your events, open tasks, email that needs a reply and a line from your journal — pulled into one calm page. Turn the AI summary on or off; the brief works either way.">
        <a className="btn btn-primary" href="#brief">See a sample brief</a>
      </PageHero>

      <section className="section" id="brief" style={{ paddingTop: 0 }}>
        <div className="container">
          <Reveal><div className="panel" data-tone="amber"><BriefDemo /></div></Reveal>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <SectionHead eyebrow="What’s inside" title="Four sources," quiet="one page." />
          <FeatureCards items={[
            { icon: faCalendarDays, t: "Your calendar", d: "Today’s events across your work and personal calendars.", tone: "tone-amber" },
            { icon: faListCheck, t: "Your tasks", d: "What’s open and what’s next, taken from your to-do lists.", tone: "tone-blue" },
            { icon: faEnvelope, t: "Your email", d: "Threads that are waiting on you, with the context kept together.", tone: "tone-clay" },
            { icon: faBookOpen, t: "Your journal", d: "A line from your own days to ground you before you start.", tone: "tone-violet" },
          ]} cols={4} />
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <Reveal>
            <div className="panel split-simple" data-tone="accent">
              <div className="stack">
                <div className="eyebrow">AI optional</div>
                <h2 className="h2">Summaries when you want them. <span className="quiet">Plain facts when you don’t.</span></h2>
                <p className="lead">With an AI provider connected, your brief can open with a short summary. Without one, you get the same information as a clean list. Either way, your content stays in your workspace.</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <CtaPanel title="Make mornings" quiet="calmer." lead="Connect your calendar and mail, and let the day arrange itself on one page." secondary={["See how it works", "/how-it-works"]} />
    </main>
  );
}
