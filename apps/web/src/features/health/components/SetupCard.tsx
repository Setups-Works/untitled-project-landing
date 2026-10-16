import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import { faHeartPulse, faMobileScreen, faShieldHalved, faRotate } from "@fortawesome/free-solid-svg-icons";

const STEPS = [
  { icon: faMobileScreen, title: "Open the app on your phone", body: "Sign in to untitled project with this same account, then open the Health tab." },
  {
    icon: faShieldHalved,
    title: "Allow access to health data",
    body: "iPhone: Apple Health. Android: Health Connect. We only ask to read steps, distance, calories, heart rate and sleep.",
  },
  { icon: faRotate, title: "Let it sync", body: "Your daily totals appear here within a minute, and stay up to date whenever you open the app." },
] as const;

/** Shown while no health data has reached the account: either the phone was never set up or access was not allowed. */
export default function SetupCard() {
  return (
    <section className="at-green tint rounded-r4 p-[clamp(20px,3vw,32px)]" aria-labelledby="health-setup">
      <div className="flex items-center gap-3">
        <span className="grid size-12 place-items-center rounded-full bg-surface text-[20px] text-(--abf)">
          <FA icon={faHeartPulse} />
        </span>
        <div>
          <h2 id="health-setup" className="font-serif text-[28px] leading-[1.1] tracking-[-0.02em]">
            Set up Health on your phone
          </h2>
          <p className="text-[14px] opacity-80">Your health data is read on your phone and shown here. Nothing is shared without your say.</p>
        </div>
      </div>
      <ol className="mt-5 grid gap-3 md:grid-cols-3">
        {STEPS.map((s, i) => (
          <li key={s.title} className="rounded-r3 bg-surface p-4">
            <p className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.1em] text-fg-faint uppercase">
              <FA icon={s.icon} className="text-(--abf)" aria-hidden />
              Step {i + 1}
            </p>
            <p className="mt-1.5 text-[15px] font-medium text-fg">{s.title}</p>
            <p className="mt-1 text-[13.5px] leading-relaxed text-fg-muted">{s.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
