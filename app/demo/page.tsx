import type { Metadata } from "next";
import { faHandPointer, faCheckDouble, faToggleOn, faEnvelopeOpenText } from "@fortawesome/free-solid-svg-icons";
import { PageHero, SectionHead, FeatureCards, CtaPanel } from "../../components/PageKit";
import DemoApp from "../../components/demo/DemoApp";
import { Reveal } from "../../components/Client";

export const metadata: Metadata = {
  title: "Product demo — untitled project",
  description: "Click around an interactive preview of the workspace: notes, to-do, email, calendar, meetings and automations.",
};

export default function Page() {
  return (
    <main>
      <PageHero eyebrow="Product demo" title="Try the workspace" quiet="right here." lead="A working preview of the whole workspace. Search with ⌘K, write notes, reply to mail, plan your week, record a meeting and turn AI off — it all responds. Nothing to install, nothing to sign up for.">
        <a className="btn btn-primary" href="#demo">Start clicking</a>
      </PageHero>

      <section className="section" id="demo" style={{ paddingTop: 0 }}>
        <div className="container">
          <Reveal><div className="demo-wrap" style={{ maxWidth: 1240 }}><DemoApp /></div></Reveal>
          <p className="meta" style={{ textAlign: "center", marginTop: 14 }}>Preview with sample data. The real workspace connects to your own notes, mail and calendar.</p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <SectionHead eyebrow="Things to try" title="Four quick" quiet="experiments." />
          <FeatureCards cols={4} items={[
            { icon: faHandPointer, t: "Switch areas", d: "Use the left menu to jump between Notes, Email, Calendar and more.", tone: "tone-blue" },
            { icon: faCheckDouble, t: "Tick a task", d: "Complete one in Notes and watch it update in To-do and Home.", tone: "tone-amber" },
            { icon: faEnvelopeOpenText, t: "Open a thread", d: "Pick a message in Email to read it with Reply and Forward options.", tone: "tone-clay" },
            { icon: faToggleOn, t: "Flip an automation", d: "Turn rules on and off in Automations.", tone: "tone-violet" },
          ]} />
        </div>
      </section>

      <CtaPanel title="Like what" quiet="you see?" lead="Bring your own notes, mail and calendar into the real thing." secondary={["How it works", "/how-it-works"]} />
    </main>
  );
}
