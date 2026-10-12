import type { Metadata } from "next";
import { faClockRotateLeft, faCompass, faDiagramProject, faLink } from "@fortawesome/free-solid-svg-icons";
import GraphDemo from "../../components/demos/GraphDemo";
import Glass from "../../components/landing/Glass";
import { Section, StatusChip } from "../../components/landing/Kit";
import { Reveal } from "../../components/landing/Reveal";
import { CtaPanel, FeatureCards, PageHero, SectionHead } from "../../components/PageKit";

export const metadata: Metadata = {
  title: "Context Graph — untitled project",
  description: "See how your notes, tasks, emails, meetings and journal entries connect to each other.",
};

export default function Page() {
  return (
    <main>
      <PageHero
        eyebrow="Context Graph"
        status={<StatusChip status="soon" />}
        title="See how everything"
        quiet="connects."
        lead="A launch plan, the email thread behind it, the meeting that decided it and the task that follows. The Context Graph shows how your work relates, so nothing sits in isolation."
      >
        <a className="btn btn-primary" href="#explore" data-cursor="Explore">
          Explore the graph
        </a>
      </PageHero>

      <Section id="explore" tight>
        <Reveal>
          <Glass tone="violet" radius="r5" className="p-[clamp(14px,3vw,36px)]">
            <GraphDemo />
          </Glass>
        </Reveal>
        <p className="mt-4 text-center text-[13.5px] text-fg-subtle">
          An illustration with sample data. The Context Graph is planned and not available yet.
        </p>
      </Section>

      <Section tight>
        <SectionHead
          eyebrow="Built on connections"
          title="Backlinks and an atlas,"
          quiet="across your whole workspace."
          lead="Notes will link to each other first. The Context Graph then carries that idea to your tasks, journal, calendar and, later, email and meetings."
        />
        <FeatureCards
          cols={4}
          items={[
            {
              icon: faLink,
              t: "Connections you can follow",
              d: "Jump from a note to the task, entry or event it’s tied to.",
              tone: "violet",
            },
            {
              icon: faDiagramProject,
              t: "See the shape of a project",
              d: "Everything around a project in one view, instead of five tabs.",
              tone: "blue",
            },
            {
              icon: faClockRotateLeft,
              t: "Context that comes back",
              d: "Return to an idea weeks later and see what surrounded it.",
              tone: "amber",
            },
            {
              icon: faCompass,
              t: "Yours, not the AI’s",
              d: "Connections live in your workspace and stay when you change AI providers.",
              tone: "clay",
            },
          ]}
        />
      </Section>

      <CtaPanel
        title="Make your work"
        quiet="make sense."
        lead="Start in one workspace and let the context build itself around you."
        secondary={["Try Universal Search", "/universal-search"]}
      />
    </main>
  );
}
