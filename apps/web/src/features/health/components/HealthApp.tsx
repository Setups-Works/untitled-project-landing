"use client";

import { faFire, faHeart, faHeartPulse, faLocationDot, faMoon, faShoePrints } from "@fortawesome/free-solid-svg-icons";
import { isoDate } from "../../../lib/dates";
import {
  fmtDistance,
  fmtDuration,
  fmtHeartRange,
  fmtNumber,
  HEALTH_GOALS,
  HEALTH_SPAN,
  HEALTH_WEEK as WEEK,
  healthRatio as ratio,
  healthTotal as total,
  SOURCE_LABEL,
} from "../format";
import { useHealthDays } from "../queries";
import SetupCard from "./SetupCard";
import StatTile from "./StatTile";
import WeeklyRing from "./WeeklyRing";

const SECTION_LABEL = "text-[11px] font-semibold tracking-[0.1em] text-fg-faint uppercase";

export default function HealthApp() {
  const { days, isPending, isError } = useHealthDays(HEALTH_SPAN);
  const latest = days[0];
  const week = days.slice(0, WEEK);
  const weekSteps = total(week, (d) => d.steps);
  const isToday = latest?.day === isoDate();
  const syncedAt = latest ? new Date(latest.synced_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "";

  return (
    <div className="mx-auto w-full max-w-[1120px]">
      <header className="mb-[18px] flex flex-col gap-1">
        <h1 className="font-serif text-[clamp(30px,3.4vw,42px)] leading-[1.04] font-normal tracking-[-0.03em] text-balance">Health</h1>
        <p className="text-[14px] text-fg-muted">
          {latest ? `Synced from ${SOURCE_LABEL[latest.source]} at ${syncedAt}` : "Activity, sleep and heart rate from your phone"}
        </p>
      </header>

      {isError ? (
        <p className="at-clay tint rounded-r3 p-4 text-[14px]" role="alert">
          Couldn’t load your health data. Please try again.
        </p>
      ) : isPending ? (
        <p className="p-6 text-xs text-fg-muted">Loading health…</p>
      ) : !latest ? (
        <SetupCard />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,340px)_1fr]">
          <section className="glass rounded-r4 p-5" aria-label="This week">
            <WeeklyRing
              fraction={ratio(weekSteps, HEALTH_GOALS.steps * WEEK)}
              label="Weekly steps"
              detail={`${fmtNumber(weekSteps)} of ${fmtNumber(HEALTH_GOALS.steps * WEEK)}`}
            />
            <ul className="mt-5 flex h-[72px] items-end gap-1.5" aria-label="Steps per day">
              {[...week].reverse().map((d) => (
                <li key={d.day} className="flex h-full flex-1 flex-col justify-end" title={`${d.day}: ${fmtNumber(d.steps ?? 0)} steps`}>
                  <span
                    className="at-blue block min-h-1 rounded-pill bg-(--abf)"
                    style={{ height: `${Math.max(ratio(d.steps ?? 0, HEALTH_GOALS.steps) * 100, 4)}%` }}
                  />
                </li>
              ))}
            </ul>
          </section>

          <section aria-label={isToday ? "Today" : latest.day}>
            <p className={`${SECTION_LABEL} mb-2`}>{isToday ? "Today" : latest.day}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <StatTile
                tint="green"
                icon={faShoePrints}
                label="Steps"
                value={latest.steps === null ? null : fmtNumber(latest.steps)}
                note={`Goal ${fmtNumber(HEALTH_GOALS.steps)}`}
                fill={ratio(latest.steps ?? 0, HEALTH_GOALS.steps)}
              />
              <StatTile
                tint="violet"
                icon={faMoon}
                label="Sleep"
                value={latest.sleep_minutes === null ? null : fmtDuration(latest.sleep_minutes)}
                note={`Goal ${fmtDuration(HEALTH_GOALS.sleepMinutes)}`}
                fill={ratio(latest.sleep_minutes ?? 0, HEALTH_GOALS.sleepMinutes)}
              />
              <StatTile
                tint="mint"
                icon={faLocationDot}
                label="Distance"
                value={latest.distance_m === null ? null : fmtDistance(latest.distance_m)}
              />
              <StatTile
                tint="amber"
                icon={faFire}
                label="Active energy"
                value={latest.active_kcal === null ? null : `${fmtNumber(latest.active_kcal)} kcal`}
              />
              <StatTile
                tint="clay"
                icon={faHeart}
                label="Heart rate"
                value={fmtHeartRange(latest)}
              />
              <StatTile
                tint="blue"
                icon={faHeartPulse}
                label="Resting heart rate"
                value={latest.resting_hr === null ? null : `${latest.resting_hr} bpm`}
              />
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
