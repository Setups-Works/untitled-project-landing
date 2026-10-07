"use client";
import { useState } from "react";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import { faWandMagicSparkles, faCalendarDays, faListCheck, faEnvelope, faBookOpen } from "@fortawesome/free-solid-svg-icons";

export default function BriefDemo() {
  const [ai, setAi] = useState(true);
  return (
    <div className="bdemo">
      <div className="bdemo-bar">
        <div>
          <div className="eyebrow">Daily Brief</div>
          <h3 className="h3" style={{ marginTop: 6 }}>Saturday, 3 October</h3>
        </div>
        <button role="switch" aria-checked={ai} className="bdemo-sw" onClick={() => setAi(!ai)}>
          <span><FA icon={faWandMagicSparkles} /> AI summary</span>
          <i className="app-sw" aria-hidden data-on={ai}><b /></i>
        </button>
      </div>
      {ai ? (
        <div className="bdemo-ai">
          <FA icon={faWandMagicSparkles} />
          <p>Light day ahead. Launch review at 11:00 is the one that matters — pricing is still open, and Maya’s thread is waiting on your reply.</p>
        </div>
      ) : (
        <div className="bdemo-ai off"><p>AI summary is off. Your brief is the plain list below — the same information, no model involved.</p></div>
      )}
      <div className="bdemo-grid">
        <section>
          <h4><FA icon={faCalendarDays} /> Today</h4>
          <ul><li><b>9:30</b> Stand-up · Google Meet</li><li><b>11:00</b> Launch review · Google Meet</li><li><b>16:30</b> Personal · Dentist</li></ul>
        </section>
        <section>
          <h4><FA icon={faListCheck} /> Open tasks</h4>
          <ul><li>Review pricing page with team</li><li>Send recap to #launch</li></ul>
        </section>
        <section>
          <h4><FA icon={faEnvelope} /> Needs a reply</h4>
          <ul><li>Re: Q3 roadmap review <small>Gmail</small></li><li>Launch checklist <small>Gmail</small></li></ul>
        </section>
        <section>
          <h4><FA icon={faBookOpen} /> From your journal</h4>
          <ul><li>“Pricing discussion unblocked everyone.”</li></ul>
        </section>
      </div>
      <p className="meta" style={{ textAlign: "center", marginTop: 12 }}>Sample data for illustration.</p>
    </div>
  );
}
