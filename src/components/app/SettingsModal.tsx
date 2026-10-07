"use client";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import type { Prefs } from "../../lib/prefs";
import SettingsView from "./SettingsView";

type Account = { name: string; email: string; hasPassword: boolean; providers: string[]; createdAt: string; avatarUrl: string | null; lastSignIn: string | null };

export default function SettingsModal({ account, prefs, onClose }: { account: Account; prefs: Prefs; onClose: () => void }) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.focus();
    const key = (e: KeyboardEvent) => {
      // A confirm dialog on top handles Escape itself.
      if (e.key === "Escape" && !document.querySelector(".cd-back")) onClose();
    };
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      document.body.style.overflow = prevOverflow;
      prev?.focus?.();
    };
  }, [onClose]);

  return createPortal(
    <div className="sm-back" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sm" role="dialog" aria-modal="true" aria-labelledby="sm-t" tabIndex={-1} ref={panel}>
        <div className="sm-head">
          <h2 id="sm-t" className="h3">Settings</h2>
          <button className="ne-btn" aria-label="Close settings" onClick={onClose}><FA icon={faXmark} /></button>
        </div>
        <div className="sm-body">
          <SettingsView account={account} prefs={prefs} />
        </div>
      </div>
    </div>,
    document.body,
  );
}
