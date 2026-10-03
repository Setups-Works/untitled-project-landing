import type { Metadata } from "next";
import { faLink, faDiagramProject, faClockRotateLeft, faCompass } from "@fortawesome/free-solid-svg-icons";
import { PageHero, SectionHead, FeatureCards, CtaPanel } from "../../components/PageKit";
import GraphDemo from "../../components/demos/GraphDemo";
import { Reveal } from "../../components/Client";

export const metadata: Metadata = {
  title: "Context Graph — untitled project",
  description: "See how your notes, tasks, emails, meetings and journal entries connect to each other.",
};

export default function Page() {
  return (
    <main>
      <PageHero eyebrow="Context Graph" title="See how everything" quiet="connects." lead="A launch plan, the email thread behind it, the meeting that decided it and the task that follows. The Context Graph shows how your work relates — so nothing sits in isolation.">
        <a className="btn btn-primary" href="#explore">Explore the graph</a>
      </PageHero>

      <section className="section" id="explore" style={{ paddingTop: 0 }}>
        <div className="container">
          <Reveal><div className="panel" data-tone="violet"><GraphDemo /></div></Reveal>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <SectionHead eyebrow="Built on connections" title="Backlinks and Atlas," quiet="taken across your whole workspace." lead="Notes already link to each other. The Context Graph carries that idea to your email, calendar, meetings, tasks and journal." />
          <FeatureCards items={[
            { icon: faLink, t: "Connections you can follow", d: "Jump from a note to the thread, the meeting or the task it’s tied to.", tone: "tone-violet" },
            { icon: faDiagramProject, t: "See the shape of a project", d: "Everything around a project in one view, instead of five tabs.", tone: "tone-blue" },
            { icon: faClockRotateLeft, t: "Context that comes back", d: "Return to an idea weeks later and see what surrounded it.", tone: "tone-amber" },
            { icon: faCompass, t: "Yours, not the AI’s", d: "Connections live in your workspace and stay when you change AI providers.", tone: "tone-clay" },
          ]} cols={4} />
        </div>
      </section>

      <CtaPanel title="Make your work" quiet="make sense." lead="Connect your notes, mail and calendar and let the context build itself around you." secondary={["Try Universal Search", "/universal-search"]} />
    </main>
  );
}
