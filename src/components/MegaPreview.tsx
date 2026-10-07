"use client";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass, faCheck, faWandMagicSparkles, faCalendarDays, faListCheck, faEnvelope, faPenToSquare, faMicrophone,
  faArrowPointer, faHouse, faBookOpen,
} from "@fortawesome/free-solid-svg-icons";

/** Small looping "product is working" animations, built entirely with CSS keyframes. */
export default function MegaPreview({ kind }: { kind: string }) {
  if (kind === "search")
    return (
      <div className="mp" data-kind="search" aria-hidden>
        <div className="mp-bar"><i /><i /><i /></div>
        <div className="mp-search">
          <FA icon={faMagnifyingGlass} />
          <span className="mp-type">launch plan</span>
          <em />
        </div>
        <div className="mp-res" style={{ ["--d" as string]: "1.6s" }}><span className="mp-dot b"><FA icon={faPenToSquare} /></span><b>Launch plan, v3</b><small>Notes</small></div>
        <div className="mp-res" style={{ ["--d" as string]: "2.0s" }}><span className="mp-dot g"><FA icon={faEnvelope} /></span><b>Re: Q3 roadmap</b><small>Gmail</small></div>
        <div className="mp-res" style={{ ["--d" as string]: "2.4s" }}><span className="mp-dot c"><FA icon={faMicrophone} /></span><b>Launch review</b><small>Meeting</small></div>
        <div className="mp-res" style={{ ["--d" as string]: "2.8s" }}><span className="mp-dot a"><FA icon={faListCheck} /></span><b>Review pricing</b><small>Task</small></div>
      </div>
    );
  if (kind === "graph")
    return (
      <div className="mp" data-kind="graph" aria-hidden>
        <div className="mp-bar"><i /><i /><i /></div>
        <div className="mp-graph">
          <svg viewBox="0 0 100 70" preserveAspectRatio="none">
            {[[18, 16], [82, 16], [16, 56], [84, 56], [50, 6]].map(([x, y], n) => (
              <line key={n} x1="50" y1="36" x2={x} y2={y} pathLength="1" style={{ ["--d" as string]: `${0.4 + n * 0.25}s` }} />
            ))}
          </svg>
          <span className="gn c0">Launch plan</span>
          <span className="gn n1" style={{ left: "18%", top: "22%", ["--d" as string]: "0.7s" }}>Email</span>
          <span className="gn n2" style={{ left: "82%", top: "22%", ["--d" as string]: "0.95s" }}>Meeting</span>
          <span className="gn n3" style={{ left: "16%", top: "80%", ["--d" as string]: "1.2s" }}>Task</span>
          <span className="gn n4" style={{ left: "84%", top: "80%", ["--d" as string]: "1.45s" }}>Journal</span>
          <span className="gn n5" style={{ left: "50%", top: "9%", ["--d" as string]: "1.7s" }}>Doc</span>
        </div>
      </div>
    );
  if (kind === "brief")
    return (
      <div className="mp" data-kind="brief" aria-hidden>
        <div className="mp-bar"><i /><i /><i /></div>
        <div className="mp-title">Saturday, 3 October</div>
        <div className="mp-ai"><FA icon={faWandMagicSparkles} /><span className="mp-type s2">Light day. Launch review at 11:00 matters.</span></div>
        {[
          [faCalendarDays, "Stand-up · 9:30", "0.9s"],
          [faCalendarDays, "Launch review · 11:00", "1.4s"],
          [faListCheck, "Review pricing page", "1.9s"],
          [faEnvelope, "Reply to Maya", "2.4s"],
        ].map(([ic, t, d], n) => (
          <div className="mp-row" key={n} style={{ ["--d" as string]: d as string }}>
            <FA icon={ic as typeof faCheck} />
            <span>{t as string}</span>
            <i className="mp-tick"><FA icon={faCheck} /></i>
          </div>
        ))}
      </div>
    );
  return (
    <div className="mp" data-kind="demo" aria-hidden>
      <div className="mp-bar"><i /><i /><i /></div>
      <div className="mp-app">
        <div className="mp-side">
          {[faHouse, faBookOpen, faPenToSquare, faListCheck, faEnvelope].map((ic, n) => (
            <span key={n} className={`mp-nav n${n}`}><FA icon={ic} /></span>
          ))}
        </div>
        <div className="mp-main">
          <div className="mp-h" />
          <div className="mp-l" style={{ width: "92%" }} />
          <div className="mp-l" style={{ width: "70%" }} />
          {["Draft announcement", "Review pricing", "Send recap"].map((t, n) => (
            <div className="mp-task" key={t} style={{ ["--d" as string]: `${1 + n * 0.9}s` }}>
              <b><FA icon={faCheck} /></b>
              {t}
            </div>
          ))}
        </div>
      </div>
      <FA icon={faArrowPointer} className="mp-cursor" />
    </div>
  );
}
