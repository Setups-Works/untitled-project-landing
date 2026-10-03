"use client";
import Link from "next/link";
import { useState } from "react";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faArrowRight, faCheck, faCircleCheck, faSpinner } from "@fortawesome/free-solid-svg-icons";
import { SURVEY } from "../../lib/validate";

type Answers = {
  role: string; tools: string[]; pains: string[]; features: string[]; ai: string; pay: string; budget: string; switchReason: string;
};
const EMPTY: Answers = { role: "", tools: [], pains: [], features: [], ai: "", pay: "", budget: "", switchReason: "" };

const STEPS = [
  { key: "role", kind: "one", req: true, q: "What best describes you?", hint: "So we know whose day we’re designing for.", opts: SURVEY.roles },
  { key: "tools", kind: "many", q: "Which tools do you use today?", hint: "Pick all that apply.", opts: SURVEY.tools },
  { key: "pains", kind: "many", q: "What frustrates you most?", hint: "Pick up to three.", opts: SURVEY.pains, max: 3 },
  { key: "features", kind: "many", q: "Which features excite you?", hint: "Pick all that apply.", opts: SURVEY.features },
  { key: "ai", kind: "one", req: true, q: "How would you like to use AI?", hint: "Your workspace works the same with or without it.", opts: SURVEY.ai },
  { key: "pay", kind: "one", q: "Would you pay for a Pro plan?", hint: "More email accounts and calendars.", opts: SURVEY.pay },
  { key: "budget", kind: "one", q: "What feels fair per month?", hint: "A rough range is fine.", opts: SURVEY.budget },
  { key: "text", kind: "text", q: "What would make you switch?", hint: "In your own words — optional, but we read every one." },
] as const;

const TONES = ["violet", "blue", "accent", "amber", "clay", "sand", "blue", "accent", "violet"] as const;
const TOTAL = STEPS.length + 1;

// Defined outside the component so React keeps the same element (and the typed input) between renders.
function Card({ tone, children }: { tone: string; children: React.ReactNode }) {
  return (
    <div className="panel wl-card" data-tone={tone}>
      {children}
    </div>
  );
} // join step + survey questions

export default function WaitlistFlow() {
  const [phase, setPhase] = useState<"join" | "survey" | "done">("join");
  const [already, setAlready] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [joinRole, setJoinRole] = useState("");
  const [a, setA] = useState<Answers>(EMPTY);
  const [i, setI] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [answered, setAnswered] = useState(false);

  async function join(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const body = Object.fromEntries(f.entries());
    setBusy(true);
    setErr("");
    try {
      const r = await fetch("/api/waitlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...body, source: "waitlist-flow" }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Something went wrong.");
      setEmail(String(body.email).toLowerCase());
      setName(String(body.name));
      setAlready(!!j.already);
      if (joinRole) setA((x) => ({ ...x, role: joinRole }));
      setPhase("survey");
    } catch (x) {
      setErr(x instanceof Error ? x.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  const s = STEPS[i];
  const last = i === STEPS.length - 1;
  const val = s.kind === "text" ? a.switchReason : (a as unknown as Record<string, unknown>)[s.key];
  const valid = !("req" in s && s.req) || (typeof val === "string" ? val.length > 0 : true);

  const toggle = (k: "tools" | "pains" | "features", o: string, max?: number) =>
    setA((x) => {
      const has = x[k].includes(o);
      if (!has && max && x[k].length >= max) return x;
      return { ...x, [k]: has ? x[k].filter((v) => v !== o) : [...x[k], o] };
    });

  async function submit() {
    setBusy(true);
    setErr("");
    try {
      const r = await fetch("/api/survey", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...a, email }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Something went wrong.");
      setAnswered(true);
      setPhase("done");
    } catch (x) {
      setErr(x instanceof Error ? x.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }
  const next = () => (last ? submit() : (setErr(""), setI(i + 1)));

  const pos = phase === "join" ? 1 : i + 2;
  const Progress = (
    <div className="wiz-top">
      <span className="eyebrow">Step {pos} of {TOTAL}</span>
      <div className="wiz-bar" role="progressbar" aria-valuemin={0} aria-valuemax={TOTAL} aria-valuenow={pos}>
        <i style={{ width: `${(pos / TOTAL) * 100}%` }} />
      </div>
    </div>
  );

  const tone = phase === "done" ? "accent" : TONES[phase === "join" ? 0 : i + 1];
  if (phase === "done")
    return (
      <Card tone={tone}><div className="wl-done" role="status">
        <span className="wl-check"><FA icon={faCircleCheck} /></span>
        <h3 className="h3">{already ? "Welcome back" : "You’re on the list"}{name ? `, ${name.split(" ")[0]}` : ""}!</h3>
        <p className="body">
          {answered ? "Thanks for the answers — they go straight to the team and help decide what we build first. " : ""}
          We’ll email <b>{email}</b> when your spot opens up.
        </p>
        <Link className="btn btn-primary" href="/">Back to the site <FA icon={faArrowRight} /></Link>
        <Link className="wl-skip" href="/demo">Try the product demo</Link>
      </div></Card>
    );

  if (phase === "join")
    return (
      <Card tone={tone}><div>
        {Progress}
        <div className="wiz-step">
          <h2 className="h3 wiz-q">Reserve your spot</h2>
          <p className="body">Takes ten seconds. After this, a few quick questions help us build the right thing first.</p>
          <form className="wl-form" onSubmit={join} noValidate>
            <label><span>Your name</span><input name="name" autoComplete="name" required maxLength={80} placeholder="Ada Lovelace" /></label>
            <label><span>Email</span><input name="email" type="email" autoComplete="email" required maxLength={254} placeholder="you@example.com" /></label>
            <label>
              <span>I’m a…</span>
              <select name="role" value={joinRole} onChange={(e) => setJoinRole(e.target.value)}>
                <option value="">Choose one (optional)</option>
                {SURVEY.roles.map((r) => <option key={r}>{r}</option>)}
              </select>
            </label>
            <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hp" />
            {err && <p className="form-err" role="alert">{err}</p>}
            <button className="btn btn-primary" disabled={busy}>
              {busy ? <><FA icon={faSpinner} spin /> Joining…</> : <>Join the waitlist <FA icon={faArrowRight} /></>}
            </button>
            <p className="meta">No spam. We’ll only email you about your spot.</p>
          </form>
        </div>
      </div></Card>
    );

  return (
    <Card tone={tone}><div>
      {Progress}
      <p className="wiz-ok"><FA icon={faCheck} /> {already ? "You’re already on the list." : "You’re on the list!"} A few quick questions:</p>
      <div className="wiz-step" key={i}>
        <h2 className="h3 wiz-q">{s.q}{"req" in s && s.req && <em> *</em>}</h2>
        <p className="body">{s.hint}</p>

        {(s.kind === "one" || s.kind === "many") && (
          <div className="wiz-opts" role={s.kind === "one" ? "radiogroup" : "group"}>
            {s.opts.map((o) => {
              const on = s.kind === "one" ? (a as unknown as Record<string, string>)[s.key] === o : (a[s.key as "tools"] as string[]).includes(o);
              return (
                <button
                  key={o}
                  type="button"
                  role={s.kind === "one" ? "radio" : "checkbox"}
                  aria-checked={on}
                  className="wiz-opt"
                  data-on={on}
                  onClick={() => (s.kind === "one" ? setA({ ...a, [s.key]: on ? "" : o }) : toggle(s.key as "tools", o, "max" in s ? s.max : undefined))}
                >
                  <span className="wiz-tick">{on && <FA icon={faCheck} />}</span>
                  {o}
                </button>
              );
            })}
          </div>
        )}
        {s.kind === "text" && (
          <textarea className="wiz-text" rows={5} maxLength={1000} value={a.switchReason} onChange={(e) => setA({ ...a, switchReason: e.target.value })} placeholder="e.g. one place for my notes and mail, with no AI lock-in…" />
        )}
        {err && <p className="form-err" role="alert">{err}</p>}
      </div>

      <div className="wiz-nav">
        <button className="btn btn-secondary btn-sm" onClick={() => setI(i - 1)} disabled={i === 0 || busy}><FA icon={faArrowLeft} /> Back</button>
        <div className="wiz-right">
          {i === 0 ? (
            <button className="wiz-skip" onClick={() => setPhase("done")}>Skip survey</button>
          ) : (
            !("req" in s && s.req) && !last && <button className="wiz-skip" onClick={next}>Skip</button>
          )}
          <button className="btn btn-primary btn-sm" onClick={next} disabled={!valid || busy}>
            {busy ? <><FA icon={faSpinner} spin /> Sending…</> : last ? <>Submit <FA icon={faCheck} /></> : <>Next <FA icon={faArrowRight} /></>}
          </button>
        </div>
      </div>
    </div></Card>
  );
}
