import type { Metadata } from "next";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import WaitlistFlow from "../../components/forms/WaitlistFlow";
import { Reveal } from "../../components/Client";

export const metadata: Metadata = {
  title: "Join the waitlist — untitled project",
  description: "Be one of the first to try untitled project: one workspace for notes, tasks, journal, email, calendar and meetings — with any AI, or none.",
};

export default function Page() {
  return (
    <main>
      <section className="phero" style={{ paddingBottom: 0 }}>
        <div className="aurora" aria-hidden />
        <div className="container wl-grid">
          <div className="wl-copy">
            <div className="chip">Early access</div>
            <h1 className="display">Join the <span className="quiet">waitlist.</span></h1>
            <p className="lead">One workspace for your notes, tasks, journal, email, calendar and meetings. Your AI can change. Your workspace shouldn’t. Be one of the first in.</p>
            <ul className="wl-perks">
              {["Early access as spots open up", "A direct line to the team", "A 2-minute survey that shapes what we build first"].map((x) => (
                <li key={x}><span><FA icon={faCheck} /></span>{x}</li>
              ))}
            </ul>
          </div>
          <Reveal>
            <WaitlistFlow />
          </Reveal>
        </div>
      </section>
    </main>
  );
}
