"use client";
import { useEffect } from "react";
import { writePrefs, type Prefs } from "../../lib/prefs";

/** Mirrors the account's preferences into localStorage and onto <html> (density, motion) on every app page. */
export default function PrefsSync({ prefs }: { prefs: Prefs }) {
  useEffect(() => {
    writePrefs(prefs);
    const el = document.documentElement;
    el.dataset.density = prefs.density;
    el.dataset.motion = prefs.reduceMotion ? "reduce" : "full";
    return () => {
      delete el.dataset.density;
      delete el.dataset.motion;
    };
  }, [prefs]);
  return null;
}
