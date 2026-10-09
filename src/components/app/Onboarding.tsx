"use client";
import * as Dialog from "@radix-ui/react-dialog";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faBookOpen,
  faCheck,
  faDownload,
  faComments,
  faListCheck,
  faMagnifyingGlass,
  faPenToSquare,
  faWandMagicSparkles,
} from "@fortawesome/free-solid-svg-icons";
import { api } from "../../lib/api/client";
import { authClient } from "../../lib/auth/client";
import { qk } from "../../lib/query/keys";
import { isoDate } from "../../lib/dates";
import { CATEGORIES } from "../../lib/notes";
import { ONBOARDING_STEPS, type Onboarding } from "../../lib/onboarding";
import type { Prefs } from "../../lib/prefs";
import GiftCard, { saveGiftCard } from "./GiftCard";

export const OPEN_ONBOARDING_EVENT = "up:open-onboarding";

const STEP_NAMES = ["Welcome", "Make it yours", "Try it", "You’re set"];
type Made = { task: boolean; journal: boolean; note: boolean };

/**
 * First-run walkthrough. Shown to new accounts and to existing ones that never finished it.
 * Progress is saved to the account after every step, so closing the tab resumes where the user left off.
 * Step 3 is interactive: the user really creates a task, a journal line and a note, so the workspace is never empty.
 */
export default function Onboarding({
  name,
  prefs: initial,
  state,
  show,
}: {
  name: string;
  prefs: Prefs;
  state: Onboarding;
  show: boolean;
}) {
  const sb = useMemo(api, []);
  const qc = useQueryClient();
  const router = useRouter();
  const [open, setOpen] = useState(show);
  const [step, setStep] = useState(state.step);
  const [display, setDisplay] = useState(name);
  const [prefs, setPrefs] = useState(initial);
  const [made, setMade] = useState<Made>({ task: false, journal: false, note: false });
  const [draft, setDraft] = useState({ task: "", journal: "", note: "" });
  const [busy, setBusy] = useState<keyof Made | "save" | null>(null);
  const [err, setErr] = useState("");
  // After the walkthrough is completed, a welcome gift card is shown before the dashboard.
  const [gift, setGift] = useState(false);

  // Reopened from the account menu ("Getting started").
  useEffect(() => {
    const again = () => {
      setStep(0);
      setMade({ task: false, journal: false, note: false });
      setOpen(true);
    };
    window.addEventListener(OPEN_ONBOARDING_EVENT, again);
    return () => window.removeEventListener(OPEN_ONBOARDING_EVENT, again);
  }, []);

  /** Progress (and optionally preferences) are saved on the profile; a changed name goes to the account. */
  const persist = async (patch: Partial<Onboarding>, extra: { preferences?: Prefs; name?: string } = {}) => {
    const next: Onboarding = { completed: state.completed, step, skippedAt: null, ...patch };
    if (extra.name) {
      const { error } = await authClient.updateUser({ name: extra.name });
      if (error) return error;
    }
    const { error } = await sb
      .from("profiles")
      .upsert({ onboarding: next, ...(extra.preferences ? { preferences: extra.preferences } : {}) }, { onConflict: "user_id" });
    return error;
  };

  const go = async (to: number) => {
    setErr("");
    if (step === 0 && display.trim() && display.trim() !== name) {
      setBusy("save");
      const e = await persist({ step: to }, { name: display.trim() });
      setBusy(null);
      if (e) return setErr("Couldn’t save your name. Try again.");
    } else if (step === 1) {
      setBusy("save");
      const e = await persist({ step: to }, { preferences: prefs });
      setBusy(null);
      if (e) return setErr("Couldn’t save your preferences. Try again.");
    } else void persist({ step: to });
    setStep(to);
  };

  const finish = async () => {
    setBusy("save");
    await persist({ completed: true, step: ONBOARDING_STEPS - 1 });
    setBusy(null);
    setGift(true);
  };

  const closeGift = () => {
    setGift(false);
    setOpen(false);
    router.refresh();
  };

  const skip = async () => {
    setOpen(false);
    await persist({ skippedAt: new Date().toISOString() });
  };

  const create = async (kind: keyof Made) => {
    const text = draft[kind].trim();
    if (!text) return;
    setBusy(kind);
    setErr("");
    const today = isoDate();
    const { error } =
      kind === "task"
        ? await sb.from("tasks").insert({ title: text.slice(0, 300), due_date: today })
        : kind === "journal"
          ? await sb.from("journal_entries").insert({ entry_date: today, body: text })
          : await sb.from("notes").insert({ title: text.slice(0, 200), body: "", category: prefs.defaultCategory });
    setBusy(null);
    if (error) return setErr("Couldn’t save that. Make sure the database migrations have been applied.");
    setMade((m) => ({ ...m, [kind]: true }));
    const keys = { task: qk.tasks.all, journal: qk.journal.all, note: qk.notes.all }[kind];
    void qc.invalidateQueries({ queryKey: keys });
  };

  const first = display.trim().split(" ")[0] || "there";
  const didCount = Object.values(made).filter(Boolean).length;

  const tryIt: { k: keyof Made; icon: typeof faListCheck; tone: string; title: string; hint: string; ph: string; multi?: boolean }[] = [
    {
      k: "task",
      icon: faListCheck,
      tone: "amber",
      title: "Add a task for today",
      hint: "Plan something small you can finish today.",
      ph: "e.g. Reply to Sam",
    },
    {
      k: "journal",
      icon: faBookOpen,
      tone: "violet",
      title: "Write one line in your journal",
      hint: "How is today going? One sentence is enough.",
      ph: "Today I’m feeling…",
      multi: true,
    },
    {
      k: "note",
      icon: faPenToSquare,
      tone: "blue",
      title: "Capture a note",
      hint: "An idea, a link, anything you want to keep.",
      ph: "e.g. Book ideas",
    },
  ];

  if (!open) return null;

  if (gift)
    return (
      <Dialog.Root open>
        <Dialog.Portal>
          <Dialog.Overlay className="ob-back">
            <Dialog.Content
              className="ob"
              aria-describedby={undefined}
              style={{ display: "grid", justifyItems: "center", gap: 20, padding: "32px 24px", textAlign: "center", maxWidth: 460 }}
              onEscapeKeyDown={(e) => e.preventDefault()}
              onInteractOutside={(e) => e.preventDefault()}
            >
              <Dialog.Title className="ob-title">A little gift for you, {first}</Dialog.Title>
              <GiftCard name={display.trim() || "Welcome"} />
              <p className="ob-lead">Your card is ready. Tilt it around, it catches the light.</p>
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 10 }}>
                <button className="btn btn-secondary" onClick={() => void saveGiftCard(display.trim() || "Welcome")}>
                  <FA icon={faDownload} /> Download card
                </button>
                <button className="btn btn-primary" onClick={closeGift} autoFocus>
                  Open my dashboard <FA icon={faArrowRight} />
                </button>
              </div>
            </Dialog.Content>
          </Dialog.Overlay>
        </Dialog.Portal>
      </Dialog.Root>
    );

  return (
    <Dialog.Root open>
      <Dialog.Portal>
        <Dialog.Overlay className="ob-back">
          <Dialog.Content
            className="ob"
            aria-describedby={undefined}
            // Closing is always an explicit choice (Skip / Finish), never an accidental Escape or outside click.
            onEscapeKeyDown={(e) => e.preventDefault()}
            onInteractOutside={(e) => e.preventDefault()}
          >
            <header className="ob-head">
              <ol className="ob-steps" aria-label="Setup progress">
                {STEP_NAMES.map((s, i) => (
                  <li key={s} data-state={i < step ? "done" : i === step ? "now" : "todo"} aria-current={i === step ? "step" : undefined}>
                    <i>{i < step ? <FA icon={faCheck} /> : i + 1}</i>
                    <span>{s}</span>
                  </li>
                ))}
              </ol>
              {step < ONBOARDING_STEPS - 1 && (
                <button className="ob-skip" onClick={skip}>
                  Skip for now
                </button>
              )}
            </header>

            <div className="ob-body" key={step}>
              {step === 0 && (
                <>
                  <span className="ob-badge">
                    <FA icon={faWandMagicSparkles} /> Welcome
                  </span>
                  <Dialog.Title className="ob-title">Let’s set up your workspace</Dialog.Title>
                  <p className="ob-lead">
                    Notes, tasks, journal and chat in one place. This takes about a minute — and you’ll create your first items along the
                    way.
                  </p>
                  <label className="ob-field">
                    <span>What should we call you?</span>
                    <input
                      value={display}
                      onChange={(e) => setDisplay(e.target.value)}
                      maxLength={80}
                      placeholder="Your name"
                      autoFocus
                      onKeyDown={(e) => e.key === "Enter" && display.trim() && go(1)}
                    />
                  </label>
                </>
              )}

              {step === 1 && (
                <>
                  <Dialog.Title className="ob-title">Make it yours, {first}</Dialog.Title>
                  <p className="ob-lead">Pick how things should look and behave. You can change any of this later in Settings.</p>
                  <div className="ob-prefs">
                    <Choice
                      label="Time format"
                      value={prefs.timeFormat}
                      onChange={(v) => setPrefs({ ...prefs, timeFormat: v })}
                      options={[
                        ["12h", "12-hour"],
                        ["24h", "24-hour"],
                      ]}
                    />
                    <Choice
                      label="Week starts on"
                      value={prefs.weekStart}
                      onChange={(v) => setPrefs({ ...prefs, weekStart: v })}
                      options={[
                        ["mon", "Monday"],
                        ["sun", "Sunday"],
                      ]}
                    />
                    <Choice
                      label="Layout density"
                      value={prefs.density}
                      onChange={(v) => setPrefs({ ...prefs, density: v })}
                      options={[
                        ["comfortable", "Comfortable"],
                        ["compact", "Compact"],
                      ]}
                    />
                    <Choice
                      label="Opens To-do on"
                      value={prefs.todoView}
                      onChange={(v) => setPrefs({ ...prefs, todoView: v })}
                      options={[
                        ["today", "Today"],
                        ["upcoming", "Upcoming"],
                        ["inbox", "Inbox"],
                      ]}
                    />
                    <label className="ob-field">
                      <span>Default note category</span>
                      <select value={prefs.defaultCategory} onChange={(e) => setPrefs({ ...prefs, defaultCategory: e.target.value })}>
                        {CATEGORIES.map((c) => (
                          <option key={c}>{c}</option>
                        ))}
                      </select>
                    </label>
                    <label className="ob-check">
                      <input
                        type="checkbox"
                        checked={prefs.reduceMotion}
                        onChange={(e) => setPrefs({ ...prefs, reduceMotion: e.target.checked })}
                      />
                      <span>Reduce motion</span>
                    </label>
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <Dialog.Title className="ob-title">Try it — create your first items</Dialog.Title>
                  <p className="ob-lead">
                    Do any of these now. They’re real, and you can delete them whenever you like. ({didCount} of 3 done)
                  </p>
                  <ul className="ob-try">
                    {tryIt.map((t) => (
                      <li key={t.k} className={`at-${t.tone}`} data-done={made[t.k]}>
                        <div className="ob-try-h">
                          <i>{made[t.k] ? <FA icon={faCheck} /> : <FA icon={t.icon} />}</i>
                          <div>
                            <b>{t.title}</b>
                            <small>{made[t.k] ? "Added — nice." : t.hint}</small>
                          </div>
                        </div>
                        {!made[t.k] && (
                          <form
                            className="ob-try-f"
                            onSubmit={(e) => {
                              e.preventDefault();
                              void create(t.k);
                            }}
                          >
                            <input
                              value={draft[t.k]}
                              onChange={(e) => setDraft({ ...draft, [t.k]: e.target.value })}
                              placeholder={t.ph}
                              maxLength={t.multi ? 2000 : 200}
                              aria-label={t.title}
                            />
                            <button className="btn btn-primary btn-sm" disabled={!draft[t.k].trim() || busy === t.k}>
                              {busy === t.k ? "Adding…" : "Add"}
                            </button>
                          </form>
                        )}
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {step === 3 && (
                <>
                  <span className="ob-badge ob-badge-ok">
                    <FA icon={faCheck} /> All set
                  </span>
                  <Dialog.Title className="ob-title">You’re ready, {first}</Dialog.Title>
                  <p className="ob-lead">A few things worth knowing:</p>
                  <ul className="ob-tips">
                    <li>
                      <i>
                        <FA icon={faMagnifyingGlass} />
                      </i>
                      <span>
                        Press <kbd>⌘</kbd> <kbd>K</kbd> (or <kbd>Ctrl</kbd> <kbd>K</kbd>) anywhere to search everything and jump to any
                        page.
                      </span>
                    </li>
                    <li>
                      <i>
                        <FA icon={faComments} />
                      </i>
                      <span>
                        <Link href="/dashboard/chat?new=1" onClick={finish}>
                          Chat
                        </Link>{" "}
                        keeps your conversations in folders you can share.
                      </span>
                    </li>
                    <li>
                      <i>
                        <FA icon={faWandMagicSparkles} />
                      </i>
                      <span>The Insights card on Home turns your journal, notes and tasks into a personality picture over time.</span>
                    </li>
                  </ul>
                  <p className="ob-note">Replay this guide any time from the account menu → Getting started.</p>
                </>
              )}
              {err && (
                <p className="form-err" role="alert">
                  {err}
                </p>
              )}
            </div>

            <footer className="ob-foot">
              {step > 0 && step < ONBOARDING_STEPS - 1 ? (
                <button className="btn btn-secondary" onClick={() => go(step - 1)}>
                  Back
                </button>
              ) : (
                <span />
              )}
              {step < ONBOARDING_STEPS - 1 ? (
                <button
                  className="btn btn-primary"
                  onClick={() => go(step + 1)}
                  disabled={busy === "save" || (step === 0 && !display.trim())}
                >
                  {step === 2 && didCount === 0 ? "Skip this step" : "Continue"} <FA icon={faArrowRight} />
                </button>
              ) : (
                <button className="btn btn-primary" onClick={finish} disabled={busy === "save"}>
                  Go to my dashboard <FA icon={faArrowRight} />
                </button>
              )}
            </footer>
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** A small segmented control for choosing one of a few options. */
function Choice<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: [T, string][];
}) {
  return (
    <div className="ob-field" role="radiogroup" aria-label={label}>
      <span>{label}</span>
      <div className="ob-seg">
        {options.map(([v, text]) => (
          <button key={v} type="button" role="radio" aria-checked={value === v} data-on={value === v} onClick={() => onChange(v)}>
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}
