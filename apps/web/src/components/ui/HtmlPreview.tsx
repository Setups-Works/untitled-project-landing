"use client";
import { useState } from "react";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import { faCheck, faCopy } from "@fortawesome/free-solid-svg-icons";

/** True for a code block that is a web page or a fragment of one, so it can be previewed. */
export const looksLikeHtml = (lang: string, code: string) =>
  /^(html?|xhtml)$/i.test(lang.trim()) || /^\s*(<!doctype html|<html[\s>])/i.test(code);

/**
 * An HTML code block with Code / Preview tabs. The preview is a sandboxed iframe: it can run the page's own scripts, but without
 * `allow-same-origin` it is a separate, empty origin, so it cannot read this app's cookies, storage or pages, and it cannot
 * navigate this tab, open pop-ups or submit forms.
 */
export default function HtmlPreview({ code }: { code: string }) {
  const [tab, setTab] = useState<"code" | "preview">("code");
  const [copied, setCopied] = useState(false);
  const copy = () => {
    void navigator.clipboard?.writeText(code).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    });
  };
  const tabs = [
    ["code", "Code"],
    ["preview", "Preview"],
  ] as const;
  return (
    <div
      className="overflow-hidden rounded-r2 bg-surface-sunken shadow-[inset_0_0_0_1px_var(--line)]"
      data-no-swipe
      // Inside a note card the tabs must not also open the note.
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-2 border-b border-line px-2 py-1.5">
        <div
          role="tablist"
          aria-label="Code or preview"
          className="flex gap-1 rounded-pill bg-white/70 p-0.5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.9)]"
        >
          {tabs.map(([k, label]) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={tab === k}
              className={`rounded-pill px-3 py-1 text-xs font-medium transition-colors ${tab === k ? "bg-fill-dark text-on-dark" : "text-fg-muted hover:text-fg"}`}
              onClick={() => setTab(k)}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="ml-auto inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-xs text-fg-muted hover:bg-white/70 hover:text-fg"
          onClick={copy}
        >
          <FA icon={copied ? faCheck : faCopy} /> {copied ? "Copied" : "Copy"}
        </button>
      </div>
      {tab === "code" ? (
        <pre className="max-h-96 overflow-auto p-3 text-[12.5px] leading-relaxed">
          <code>{code}</code>
        </pre>
      ) : (
        <iframe title="HTML preview" sandbox="allow-scripts" srcDoc={code} className="block h-96 w-full resize-y border-0 bg-white" />
      )}
    </div>
  );
}
