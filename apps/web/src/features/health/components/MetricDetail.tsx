"use client";

import { faChevronLeft, faWandMagicSparkles } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { isoDate } from "../../../lib/dates";
import { toneClass } from "../../../lib/tones";
import {
  daysInRange,
  HEALTH_METRICS,
  HEALTH_SPAN,
  healthRatio as ratio,
  metricPrompt,
  metricRowText,
  metricSeries,
  parseRange,
  rangeMeta,
  type HealthMetric,
  type HealthRange,
} from "../format";
import { useHealthDays } from "../queries";
import RangeFilter from "./RangeFilter";

const SECTION_LABEL = "text-[11px] font-semibold tracking-[0.1em] text-fg-faint uppercase";
const shortDay = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });

/** One metric over a range: the headline, a bar per day (with the goal line), average / best / lowest, and every day listed. */
export default function MetricDetail({ metric }: { metric: HealthMetric }) {
  const def = HEALTH_METRICS[metric];
  const q = useSearchParams().get("range");
  const [range, setRange] = useState<HealthRange>(parseRange(q) ?? "week");
  const { days, isPending, isError } = useHealthDays(HEALTH_SPAN);
  const today = isoDate();
  const series = useMemo(() => metricSeries(days, metric, range, today), [days, metric, range, today]);
  const rows = useMemo(() => daysInRange(days, range, today), [days, range, today]);
  const meta = rangeMeta(range, today);
  const daysWithData = useMemo(() => days.filter((d) => def.pick(d) !== null).map((d) => d.day), [days, def]);
  const peak = Math.max(def.goal ?? 0, ...series.points.map((p) => p.value ?? 0), 1);
  const stats: { label: string; value: string | null; note?: string }[] = [
    { label: def.kind === "total" ? "Daily average" : "Average", value: series.average === null ? null : def.format(series.average) },
    {
      label: metric === "heart" ? "Highest" : "Best day",
      value: series.best?.value == null ? null : def.format(series.best.value),
      note: series.best ? shortDay(series.best.day) : undefined,
    },
    {
      label: metric === "heart" ? "Lowest" : "Lowest day",
      value: series.lowest?.value == null ? null : def.format(series.lowest.value),
      note: series.lowest ? shortDay(series.lowest.day) : undefined,
    },
    { label: "Days with data", value: `${series.recorded} of ${series.points.length}` },
  ];

  return (
    <div className="mx-auto w-full max-w-[940px]">
      <Link href="/dashboard/health" className="btn btn-secondary btn-sm mb-4 w-fit">
        <FA icon={faChevronLeft} /> Health
      </Link>
      <header className="mb-[18px] flex flex-col gap-1">
        <h1 className="font-serif text-[clamp(30px,3.4vw,42px)] leading-[1.04] font-normal tracking-[-0.03em] text-balance">{def.label}</h1>
        <p className="text-[14px] text-fg-muted">
          {meta.label}
          {def.goal ? ` · goal ${def.format(def.goal)} a day` : ""}
        </p>
      </header>

      {isError ? (
        <p className="at-clay tint rounded-r3 p-4 text-[14px]" role="alert">
          Couldn’t load your health data. Please try again.
        </p>
      ) : isPending ? (
        <p className="p-6 text-xs text-fg-muted">Loading…</p>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <RangeFilter value={range} onChange={setRange} today={today} daysWithData={daysWithData} count={series.recorded} />
            <Link href={`/dashboard/chat?ask=${encodeURIComponent(metricPrompt(metric, range))}`} className="btn btn-primary btn-sm">
              <FA icon={faWandMagicSparkles} /> Ask the assistant
            </Link>
          </div>

          <section className={`${toneClass(def.tone)} tint rounded-r4 p-5 sm:p-6`} aria-label={`${def.label}, ${meta.label}`}>
            <p className="text-[13px] opacity-80">{def.kind === "total" ? "Total" : "Average"}</p>
            <p className="font-serif text-[clamp(40px,6vw,60px)] leading-none tracking-[-0.03em]">
              {series.headline === null ? "No data" : def.format(series.headline)}
            </p>
            {series.points.length > 1 ? (
              <ul className="mt-6 flex h-[140px] items-end gap-1" aria-label={`${def.label} per day`}>
                {series.points.map((p) => (
                  <li
                    key={p.day}
                    className="relative flex h-full min-w-0 flex-1 flex-col justify-end"
                    title={`${shortDay(p.day)}: ${p.value === null ? "no data" : def.format(p.value)}`}
                  >
                    <span
                      className={`block min-h-1 rounded-pill ${p.value === null ? "bg-(--abl)" : "bg-(--abf)"}`}
                      style={{ height: `${Math.max(ratio(p.value ?? 0, peak) * 100, 3)}%` }}
                    />
                  </li>
                ))}
              </ul>
            ) : def.goal ? (
              // One day has nothing to compare against, so show progress toward the goal instead of a lone bar.
              <div
                className="mt-6 h-3.5 overflow-hidden rounded-pill bg-(--abl)"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(ratio(series.headline ?? 0, def.goal) * 100)}
                aria-label="Progress toward the goal"
              >
                <div className="h-full rounded-pill bg-(--abf)" style={{ width: `${Math.round(ratio(series.headline ?? 0, def.goal) * 100)}%` }} />
              </div>
            ) : null}
            {def.goal ? (
              <p className="mt-2 text-[12.5px] opacity-80">
                Goal {def.format(def.goal)} a day ·{" "}
                {series.points.length === 1
                  ? `${Math.round(ratio(series.headline ?? 0, def.goal) * 100)}% reached`
                  : `met on ${series.points.filter((p) => (p.value ?? 0) >= def.goal!).length} of ${series.points.length} days`}
              </p>
            ) : null}
          </section>

          <section aria-label="Summary" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="glass rounded-r3 p-4">
                <p className={SECTION_LABEL}>{s.label}</p>
                <p className="mt-1 font-serif text-[24px] leading-tight tracking-[-0.02em]">{s.value ?? "No data"}</p>
                {s.note && <p className="text-[12.5px] text-fg-muted">{s.note}</p>}
              </div>
            ))}
          </section>

          <section aria-label="Day by day">
            <p className={`${SECTION_LABEL} mb-2`}>Day by day</p>
            {rows.length === 0 ? (
              <p className="ap-none glass rounded-r3 p-5 text-[14px] text-fg-muted">Nothing recorded in this period yet.</p>
            ) : (
              <ul className="glass overflow-hidden rounded-r3">
                {rows.map((d) => {
                  const text = metricRowText(metric, d);
                  const v = def.pick(d);
                  return (
                    <li key={d.day} className="flex items-center gap-4 px-4 py-3 text-[14.5px] odd:bg-white/40">
                      <span className="w-[120px] shrink-0 text-fg-muted">{d.day === today ? "Today" : shortDay(d.day)}</span>
                      <span
                        className={`${toneClass(def.tone)} relative h-2 min-w-0 flex-1 overflow-hidden rounded-pill bg-(--abl)`}
                        aria-hidden
                      >
                        <span
                          className="absolute inset-y-0 left-0 rounded-pill bg-(--abf)"
                          style={{ width: `${Math.round(ratio(v ?? 0, peak) * 100)}%` }}
                        />
                      </span>
                      <span className="w-[110px] shrink-0 text-right font-medium">{text ?? "No data"}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
