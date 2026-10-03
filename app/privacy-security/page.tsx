import type { Metadata } from "next";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import { faCheck, faKey, faBan, faUserLock, faFileExport, faPlugCircleCheck, faCodeBranch } from "@fortawesome/free-solid-svg-icons";
import { PageHero, SectionHead, FeatureCards, CtaPanel } from "../../components/PageKit";
import { Reveal } from "../../components/Client";

export const metadata: Metadata = {
  title: "Privacy & Security — untitled project",
  description: "How untitled project keeps your workspace yours: separate from your AI, connected only to what you choose, and always exportable.",
};

export default function Page() {
  return (
    <main>
      <PageHero eyebrow="Privacy & Security" title="Your workspace stays" quiet="yours." lead="Your notes, journal and mail are personal. untitled project is designed so that you decide what connects, whether AI is involved at all, and how to take your work with you.">
        <a className="btn btn-primary" href="#principles">Read our principles</a>
      </PageHero>

      <section className="section" id="principles" style={{ paddingTop: 0 }}>
        <div className="container">
          <SectionHead eyebrow="Principles" title="Control is the" quiet="default." />
          <FeatureCards items={[
            { icon: faCodeBranch, t: "Workspace separate from AI", d: "Your content lives in your workspace, not inside an AI provider. Change models or providers and nothing moves.", tone: "tone-green" },
            { icon: faBan, t: "AI-free mode", d: "Use AI when it helps, or keep the workspace fully AI-free. Nothing is sent to a model you haven’t chosen.", tone: "tone-clay" },
            { icon: faKey, t: "Bring your own key", d: "Connect your own API key and provider directly, so you stay in control of that relationship.", tone: "tone-violet" },
            { icon: faPlugCircleCheck, t: "You choose what connects", d: "Gmail, Google Calendar and other tools are connected by you, one at a time — and only the ones you pick.", tone: "tone-blue" },
            { icon: faUserLock, t: "A journal that’s private", d: "Your journal is a private record of your days, kept separate from the rest of the workspace.", tone: "tone-amber" },
            { icon: faFileExport, t: "Take your work with you", d: "Import and export are built in, so you’re never locked in.", tone: "tone-green" },
          ]} />
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <Reveal>
            <div className="panel" data-tone="dark">
              <div className="ps-grid">
                <div className="stack">
                  <div className="eyebrow" style={{ color: "#f4f3e999" }}>In the open</div>
                  <h2 className="h2">Security details, <span className="quiet">published before launch.</span></h2>
                  <p className="lead">We don’t make security claims we haven’t documented. Before launch we’ll publish how data is stored and protected, which permissions each connection asks for, and how long anything is kept.</p>
                </div>
                <ul className="ps-list">
                  {["How your data is stored and protected", "Permissions requested by each integration", "Data retention and deletion", "How AI providers are called, and what they receive"].map((x) => (
                    <li key={x}><span aria-hidden><FA icon={faCheck} /></span>{x}</li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <CtaPanel title="Questions about" quiet="your data?" lead="Start with the notes, connect only what you want, and keep AI off until you’re ready." primary={["Get started", "/#start"]} secondary={["Read the FAQ", "/#faq"]} />
    </main>
  );
}

