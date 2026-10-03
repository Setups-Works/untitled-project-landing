import Link from "next/link";
import type { ReactNode } from "react";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { Reveal } from "./Client";

export function PageHero({
  eyebrow,
  title,
  quiet,
  lead,
  children,
}: {
  eyebrow: string;
  title: string;
  quiet?: string;
  lead: string;
  children?: ReactNode;
}) {
  return (
    <section className="phero">
      <div className="aurora" aria-hidden />
      <div className="container pinner">
        <div className="chip" style={{ marginBottom: 22 }}>
          {eyebrow}
        </div>
        <h1 className="display">
          {title} {quiet && <span className="quiet">{quiet}</span>}
        </h1>
        <p className="lead" style={{ margin: "20px auto 0" }}>
          {lead}
        </p>
        {children && <div className="cta">{children}</div>}
      </div>
    </section>
  );
}

export function SectionHead({ eyebrow, title, quiet, lead }: { eyebrow: string; title: string; quiet?: string; lead?: string }) {
  return (
    <Reveal className="center stack">
      <div className="eyebrow">{eyebrow}</div>
      <h2 className="h2">
        {title} {quiet && <span className="quiet">{quiet}</span>}
      </h2>
      {lead && <p className="lead">{lead}</p>}
    </Reveal>
  );
}

export function FeatureCards({
  items,
  cols = 3,
}: {
  items: { icon: IconDefinition; t: string; d: string; tone?: string }[];
  cols?: 2 | 3 | 4;
}) {
  return (
    <Reveal>
      <div className={`grid ${cols === 4 ? "g4" : cols === 2 ? "g2" : "g3"}`} style={{ marginTop: 44 }}>
        {items.map((x) => (
          <div className="card" data-interactive key={x.t}>
            <div className={`tile ${x.tone ?? ""}`}>
              <FA icon={x.icon} />
            </div>
            <div className="card-title" style={{ marginTop: 6 }}>
              {x.t}
            </div>
            <p className="body">{x.d}</p>
          </div>
        ))}
      </div>
    </Reveal>
  );
}

export function CtaPanel({
  title,
  quiet,
  lead,
  primary = ["Join the waitlist", "/waitlist"],
  secondary,
}: {
  title: string;
  quiet?: string;
  lead: string;
  primary?: [string, string];
  secondary?: [string, string];
}) {
  return (
    <section className="section" style={{ paddingTop: 0 }}>
      <div className="container">
        <Reveal>
          <div className="panel center stack" data-tone="forest">
            <h2 className="h2">
              {title} {quiet && <span className="quiet">{quiet}</span>}
            </h2>
            <p className="lead">{lead}</p>
            <div className="cta" style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <Link className="btn btn-primary" href={primary[1]}>
                {primary[0]} <FA icon={faArrowRight} />
              </Link>
              {secondary && (
                <Link className="btn btn-secondary" href={secondary[1]}>
                  {secondary[0]}
                </Link>
              )}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
