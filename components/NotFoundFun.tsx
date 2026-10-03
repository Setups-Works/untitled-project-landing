"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import {
  faArrowRight, faBookOpen, faCalendarDays, faEnvelope, faHouse, faListCheck, faMagnifyingGlass, faMicrophone, faPenToSquare, faPlay, faWandMagicSparkles,
} from "@fortawesome/free-solid-svg-icons";

const QUIPS = [
  "This page left no forwarding address — unlike your 47 unread emails.",
  "Our Context Graph shows this page is connected to… nothing. Honestly, impressive.",
  "Universal Search found 0 results. We even checked the sofa cushions.",
  "AI is off, and even we can tell that URL is wrong.",
  "Maybe you typed it with your eyes closed? No judgment. Okay, a little.",
  "Plot twist: the page never existed. We just let you believe it did.",
  "We asked the Daily Brief. It said today’s top priority is: not this.",
];

const POKES = [
  "Ouch.", "Rude.", "It’s not a button.", "Stop poking the 404.", "We have feelings. Mostly sarcasm, though.",
  "Okay fine, you win. Here’s a confetti. 🎉 (Imaginary. Budget cuts.)",
];

const FLOATERS = [
  [faEnvelope, "6%", "18s", "-2s", "green"], [faPenToSquare, "18%", "22s", "-9s", "blue"], [faCalendarDays, "32%", "20s", "-5s", "amber"],
  [faListCheck, "48%", "24s", "-13s", "violet"], [faBookOpen, "63%", "19s", "-7s", "clay"], [faMicrophone, "78%", "23s", "-1s", "green"],
  [faWandMagicSparkles, "90%", "21s", "-11s", "violet"],
] as const;

export default function NotFoundFun() {
  const [q, setQ] = useState(0);
  const [pokes, setPokes] = useState(0);
  const [term, setTerm] = useState("");
  const [asked, setAsked] = useState("");

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setQ((n) => (n + 1) % QUIPS.length), 4200);
    return () => clearInterval(t);
  }, []);

  const path = typeof window !== "undefined" ? window.location.pathname : "/???";

  return (
    <main className="nf">
      <div className="nf-sky" aria-hidden>
        {FLOATERS.map(([ic, left, dur, delay, tone], n) => (
          <span key={n} className={`nf-fl at-${tone}`} style={{ left, animationDuration: dur, animationDelay: delay }}>
            <FA icon={ic} />
          </span>
        ))}
      </div>

      <div className="container nf-in">
        <div className="chip">Error 404 · it’s not us, it’s you</div>

        <button className="nf-num" onClick={() => setPokes((p) => p + 1)} aria-label="The number 404. Please stop poking it.">
          <span>4</span>
          <span className="nf-zero" data-p={pokes % 2}><FA icon={faMagnifyingGlass} /></span>
          <span>4</span>
        </button>
        <p className="nf-poke" role="status">{pokes > 0 ? POKES[Math.min(pokes - 1, POKES.length - 1)] : " "}</p>

        <h1 className="h2">We looked everywhere. <span className="quiet">(We didn’t.)</span></h1>
        <p className="lead nf-quip" key={q}>{QUIPS[q]}</p>

        <form
          className="nf-search"
          onSubmit={(e) => {
            e.preventDefault();
            setAsked(term.trim() || path);
          }}
        >
          <FA icon={faMagnifyingGlass} />
          <input value={term} onChange={(e) => setTerm(e.target.value)} placeholder={`Search for “${path}”…`} aria-label="Search for the missing page" />
          <button className="btn btn-primary btn-sm">Search</button>
        </form>

        {asked && (
          <div className="nf-res" role="status">
            <b>Results for “{asked}”</b>
            <ul>
              <li>0 notes</li><li>0 tasks</li><li>0 emails</li><li>0 meetings</li><li>1 existential crisis</li>
            </ul>
            <small>Universal Search has seen things. This isn’t one of them.</small>
          </div>
        )}

        <div className="nf-cta">
          <Link className="btn btn-primary" href="/"><FA icon={faHouse} /> Take me home</Link>
          <Link className="btn btn-secondary" href="/demo"><FA icon={faPlay} /> Try the demo (it exists, promise)</Link>
          <Link className="btn btn-secondary" href="/waitlist">Join the waitlist <FA icon={faArrowRight} /></Link>
        </div>

        <pre className="nf-log" aria-hidden>
{`$ locate ${path}
> searching notes...      nothing
> searching tasks...      nothing
> searching your hopes... also nothing
> asking the AI...        AI is off, enjoy the silence
> verdict: this page has left the workspace`}
        </pre>
      </div>
    </main>
  );
}
