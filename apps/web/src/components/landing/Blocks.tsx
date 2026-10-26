import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { faCheck, faMinus } from "@fortawesome/free-solid-svg-icons";
import Glass from "./Glass";
import { IconTile } from "./Kit";
import { R, Reveal } from "./Reveal";
import type { Tone } from "../../lib/tones";

/** Numbered steps as tinted glass cards. */
export function StepCards({
  steps,
}: {
  steps: readonly { icon: IconDefinition; tone: Tone; t: string; d: string; pts: readonly string[] }[];
}) {
  return (
    <Reveal stagger={0.12} className="mt-[clamp(28px,4vw,52px)] grid gap-4 md:grid-cols-2">
      {steps.map((s, n) => (
        <R key={s.t}>
          <Glass variant="flat" radius="r4" tone={s.tone} glare tilt lift className="flex h-full flex-col gap-3 p-6 sm:p-8">
            <div className="flex items-start justify-between">
              <IconTile icon={s.icon} className="size-12" />
              <span className="font-serif text-[56px] leading-none tracking-[-0.04em] text-(--abf)/25">
                {String(n + 1).padStart(2, "0")}
              </span>
            </div>
            <h3 className="font-serif text-[28px] leading-tight tracking-[-0.022em]">{s.t}</h3>
            <p className="text-[15.5px] leading-relaxed text-fg-muted">{s.d}</p>
            <ul className="mt-1 flex flex-col gap-2">
              {s.pts.map((p) => (
                <li key={p} className="flex items-center gap-2.5 text-[14.5px] text-fg">
                  <FA icon={faCheck} className="text-[12px] text-(--abf)" />
                  {p}
                </li>
              ))}
            </ul>
          </Glass>
        </R>
      ))}
    </Reveal>
  );
}

/** A day told in four moments. */
export function DayTimeline({ moments }: { moments: readonly { time: string; icon: IconDefinition; tone: Tone; t: string; d: string }[] }) {
  return (
    <Reveal stagger={0.14} className="mt-[clamp(28px,4vw,52px)] grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {moments.map((m) => (
        <R key={m.t}>
          <Glass variant="flat" radius="r4" tone={m.tone} glare lift className="flex h-full flex-col gap-3 p-6">
            <div className="flex items-center justify-between">
              <IconTile icon={m.icon} />
              <span className="font-mono text-[13px] text-(--abf)">{m.time}</span>
            </div>
            <h3 className="text-[17px] font-semibold tracking-[-0.01em] text-fg">{m.t}</h3>
            <p className="text-[14.5px] leading-relaxed text-fg-muted">{m.d}</p>
          </Glass>
        </R>
      ))}
    </Reveal>
  );
}

/** Who can see what: one row per kind of data. */
export function AccessMatrix({ rows }: { rows: { what: string; who: string; note: string }[] }) {
  return (
    <Reveal className="mt-[clamp(28px,4vw,52px)]">
      <Glass radius="r4" className="overflow-hidden">
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">Who can see what</caption>
          <thead>
            <tr className="text-[11px] font-semibold tracking-[0.1em] text-fg-faint uppercase">
              <th scope="col" className="px-5 py-4 sm:px-6">
                What
              </th>
              <th scope="col" className="px-5 py-4 sm:px-6">
                Who can see it
              </th>
              <th scope="col" className="hidden px-5 py-4 sm:table-cell sm:px-6">
                Good to know
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.what} className="border-t border-line align-top transition-colors hover:bg-white/50">
                <th scope="row" className="px-5 py-4 text-[15px] font-medium text-fg sm:px-6">
                  {r.what}
                </th>
                <td className="px-5 py-4 text-[15px] text-green-fg sm:px-6">{r.who}</td>
                <td className="hidden px-5 py-4 text-[14.5px] leading-relaxed text-fg-muted sm:table-cell sm:px-6">{r.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Glass>
    </Reveal>
  );
}

/** Plan comparison: `true` is a tick, `false` a dash, a string is shown as is. */
export function CompareTable({ plans, rows }: { plans: string[]; rows: { label: string; values: (boolean | string)[] }[] }) {
  const cell = (v: boolean | string) =>
    typeof v === "string" ? (
      <span className="text-[14.5px] font-medium text-fg">{v}</span>
    ) : v ? (
      <>
        <FA icon={faCheck} className="text-green-fg" aria-hidden />
        <span className="sr-only">Included</span>
      </>
    ) : (
      <>
        <FA icon={faMinus} className="text-fg-faint" aria-hidden />
        <span className="sr-only">Not included</span>
      </>
    );
  return (
    <Reveal className="mt-[clamp(28px,4vw,52px)]">
      <Glass radius="r4" className="overflow-hidden">
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">Compare plans</caption>
          <thead>
            <tr>
              <th scope="col" className="px-5 py-4 sm:px-6">
                <span className="sr-only">Feature</span>
              </th>
              {plans.map((p) => (
                <th key={p} scope="col" className="px-4 py-4 text-center font-serif text-[22px] font-normal tracking-[-0.02em]">
                  {p}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="border-t border-line transition-colors hover:bg-white/50">
                <th scope="row" className="px-5 py-3.5 text-[15px] font-normal text-fg sm:px-6">
                  {r.label}
                </th>
                {plans.map((p, i) => (
                  <td key={p} className="px-4 py-3.5 text-center">
                    {cell(r.values[i] ?? false)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Glass>
    </Reveal>
  );
}
