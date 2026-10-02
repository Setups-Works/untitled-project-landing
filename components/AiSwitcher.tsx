"use client";
import { useEffect, useState } from "react";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import {
  faPlug,
  faKey,
  faWallet,
  faBan,
  faLock,
  faMicrochip,
} from "@fortawesome/free-solid-svg-icons";

const OPTS = [
  {
    icon: faPlug,
    title: "Use a supported AI account",
    desc: "Connect an AI account you already have.",
    node: "Your AI account",
  },
  {
    icon: faKey,
    title: "Bring your own API key",
    desc: "Choose your model provider and connect it directly.",
    node: "Your API key",
  },
  {
    icon: faWallet,
    title: "Pay for usage when you need it",
    desc: "Top up only when you need AI. No bundled AI subscription.",
    node: "Pay as you go",
  },
  {
    icon: faBan,
    title: "Take a break from AI",
    desc: "Keep your workspace fully AI-free.",
    node: "AI off",
    off: true,
  },
];

export default function AiSwitcher() {
  const [on, setOn] = useState(0);
  const [auto, setAuto] = useState(true);
  useEffect(() => {
    if (!auto || window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      return;
    const t = setInterval(() => setOn((o) => (o + 1) % OPTS.length), 3200);
    return () => clearInterval(t);
  }, [auto]);
  const cur = OPTS[on];
  return (
    <div
      className="aisw"
      onMouseEnter={() => setAuto(false)}
      onMouseLeave={() => setAuto(true)}
    >
      <div className="aisw-stage" data-off={!!cur.off}>
        <div className="aisw-ws">
          <div className="aisw-label">
            <FA icon={faLock} /> Your workspace
          </div>
          <div className="aisw-items">
            {["Notes", "Tasks", "Journal", "Email"].map((x) => (
              <span key={x}>{x}</span>
            ))}
          </div>
          <div className="aisw-sub">Stays exactly where it is</div>
        </div>
        <div className="aisw-wire" aria-hidden>
          <i />
        </div>
        <div className="aisw-node" key={on}>
          <FA icon={cur.off ? faBan : faMicrochip} />
          <span>{cur.node}</span>
        </div>
      </div>
      <div className="aisw-opts" role="tablist" aria-label="AI options">
        {OPTS.map((o, n) => (
          <button
            key={o.title}
            role="tab"
            aria-selected={n === on}
            className="aisw-opt"
            onClick={() => {
              setOn(n);
              setAuto(false);
            }}
          >
            <span className="aisw-ico">
              <FA icon={o.icon} />
            </span>
            <span>
              <b>{o.title}</b>
              <small>{o.desc}</small>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
