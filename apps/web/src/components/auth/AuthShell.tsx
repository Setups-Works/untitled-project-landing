import type { ReactNode } from "react";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import { faBookOpen, faEnvelope, faCalendarDays, faWandMagicSparkles, faShieldHalved } from "@fortawesome/free-solid-svg-icons";

const POINTS = [
  { icon: faBookOpen, t: "Notes, journal and tasks", tone: "violet" },
  { icon: faEnvelope, t: "Gmail in your workspace", tone: "green" },
  { icon: faCalendarDays, t: "One view of your time", tone: "amber" },
  { icon: faWandMagicSparkles, t: "Any AI — or none", tone: "blue" },
];

export default function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="au">
      <div className="aurora" aria-hidden />
      <div className="container au-grid">
        <aside className="au-side">
          <div className="chip">untitled project</div>
          <h2 className="display">
            Your AI can change. <span className="quiet">Your workspace shouldn’t.</span>
          </h2>
          <ul className="au-points">
            {POINTS.map((p) => (
              <li key={p.t} className={`at-${p.tone}`}>
                <span>
                  <FA icon={p.icon} />
                </span>
                {p.t}
              </li>
            ))}
          </ul>
          <p className="au-trust">
            <FA icon={faShieldHalved} /> Your content stays in your workspace, whichever AI you choose.
          </p>
        </aside>
        <div className="au-card">{children}</div>
      </div>
    </main>
  );
}
