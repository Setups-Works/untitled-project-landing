"use client";

import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import { faBookOpen, faPenToSquare, faWandMagicSparkles } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { HEALTH_ACTIONS, healthPrompt, type HealthAction, type HealthRange } from "../format";

const ICON = { ask: faWandMagicSparkles, journal: faBookOpen, note: faPenToSquare } as const;

/**
 * Hands the numbers on screen to the chat assistant, like the other chat actions: it answers, or drafts a journal entry or note that
 * the person confirms there. Nothing is saved from this page.
 */
export default function HealthActions({ range }: { range: HealthRange }) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Use this with the assistant">
      {HEALTH_ACTIONS.map((a: { key: HealthAction; label: string }) => (
        <Link
          key={a.key}
          href={`/dashboard/chat?ask=${encodeURIComponent(healthPrompt(a.key, range))}`}
          className={`btn btn-sm ${a.key === "ask" ? "btn-primary" : "btn-secondary"}`}
        >
          <FA icon={ICON[a.key]} /> {a.label}
        </Link>
      ))}
    </div>
  );
}
