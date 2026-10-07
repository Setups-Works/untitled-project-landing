"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faCalendarDay, faChevronLeft, faChevronRight, faCircleCheck, faClock, faFaceSmile, faFire, faPenNib, faSun, faTag, faWandMagicSparkles,
} from "@fortawesome/free-solid-svg-icons";
import { supabaseBrowser } from "../../lib/supabase/client";
import { analyse, type InEntry, type InNote, type InTask, type Observation } from "../../lib/insights";
import Radar from "./Radar";

const ICONS: Record<Observation["icon"], IconDefinition> = {
  check: faCircleCheck, clock: faClock, fire: faFire, pen: faPenNib, sun: faSun, tag: faTag, smile: faFaceSmile, calendar: faCalendarDay,
};

/** Personality insights, worked out from the user's own journal, notes and tasks. Nothing leaves the browser. */
export default function InsightsCard() {
  const sb = useMemo(supabaseBrowser, []);
  const [data, setData] = useState<{ tasks: InTask[]; entries: InEntry[]; notes: InNote[] } | null>(null);
  const [err, setErr] = useState(false);
  const [page, setPage] = useState(0);

  useEffect(() => {
    let live = true;
    (async () => {
      const since = new Date(Date.now() - 120 * 86_400_000).toISOString().slice(0, 10);
      const [t, j, n] = await Promise.all([
        sb.from("tasks").select("due_date,done,done_at,created_at,priority,list_id,cancelled,archived,recurrence").limit(5000),
        sb.from("journal_entries").select("entry_date,body,created_at").gte("entry_date", since).limit(2000),
        sb.from("notes").select("title,body,category,created_at,updated_at").limit(2000),
      ]);
      if (!live) return;
      if (t.error || j.error || n.error) return setErr(true);
      setData({ tasks: (t.data ?? []) as InTask[], entries: (j.data ?? []) as InEntry[], notes: (n.data ?? []) as InNote[] });
    })();
    return () => { live = false; };
  }, [sb]);

  const result = useMemo(() => (data ? analyse(data.tasks, data.entries, data.notes) : null), [data]);

  const head = (
    <div className="ap-card-h">
      <span><FA icon={faWandMagicSparkles} /> Personality insights</span>
      {result?.enough && (
        <span className="ap-pager">
          <button className="ne-btn" aria-label="Previous page" disabled={page === 0} onClick={() => setPage(0)}><FA icon={faChevronLeft} /></button>
          <button className="ne-btn" aria-label="Next page" disabled={page === 1} onClick={() => setPage(1)}><FA icon={faChevronRight} /></button>
        </span>
      )}
    </div>
  );

  if (err)
    return <section className="ap-card at-gold">{head}<p className="ap-none">Couldn’t load your insights right now.</p></section>;
  if (!result)
    return <section className="ap-card at-gold">{head}<p className="ap-none">Reading your workspace…</p></section>;
  if (!result.enough)
    return (
      <section className="ap-card at-gold">
        {head}
        <div className="ap-empty">
          <p>Insights appear once there’s something to look at. Write a few journal entries, jot some notes and add tasks — they’re worked out from what you actually do.</p>
          <div className="st-actions">
            <Link className="btn btn-secondary btn-sm" href="/dashboard/journal">Journal</Link>
            <Link className="btn btn-secondary btn-sm" href="/dashboard/notes?new=1">Notes</Link>
            <Link className="btn btn-secondary btn-sm" href="/dashboard/todo">To-do</Link>
          </div>
        </div>
      </section>
    );

  return (
    <section className="ap-card at-gold" aria-label="Personality insights">
      {head}
      {page === 0 ? (
        <div className="ap-pers">
          <div className="ap-pers-top">
            <div><b className="ap-type ap-type-name">{result.name}</b><span>{result.summary}</span></div>
          </div>
          <div className="ap-tags">{result.tags.map((t) => <i key={t}>{t}</i>)}</div>
          <Radar axes={result.axes} />
          <ul className="ap-legend">
            {[...result.axes].sort((a, b) => b.value - a.value).slice(0, 3).map((a) => (
              <li key={a.key}><b>{a.label}</b><span>{a.why}</span><em>{a.value}</em></li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="ap-pers ap-obs">
          {result.observations.length > 0 ? (
            <ul>{result.observations.map((o, i) => <li key={i}><span><FA icon={ICONS[o.icon]} /></span>{o.text}</li>)}</ul>
          ) : <p className="ap-none">Keep going — patterns show up after a few more days.</p>}
          {result.words.length > 0 && (
            <div className="ap-words">
              <b>On your mind lately</b>
              <div>{result.words.map(([w, n]) => <i key={w} title={`${n} times`}>{w}</i>)}</div>
            </div>
          )}
        </div>
      )}
      <div className="ap-dots" role="tablist" aria-label="Insight pages">
        {[0, 1].map((p) => <button key={p} role="tab" aria-selected={page === p} aria-label={p === 0 ? "Profile" : "Patterns"} data-on={page === p} onClick={() => setPage(p)} />)}
      </div>
      <p className="ap-fine">Worked out on your device from your journal, notes and tasks. Patterns, not a diagnosis.</p>
    </section>
  );
}
