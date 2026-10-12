import Link from "next/link";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import { faArrowRight, faShieldHalved } from "@fortawesome/free-solid-svg-icons";
import Glass from "../Glass";
import { TRUST } from "../content";
import { IconTile, Section, SectionHead } from "../Kit";
import { R, Reveal } from "../Reveal";
import { Tip } from "../Tip";

/** Real sign-in and data controls only — each one is in docs/SECURITY.md. Hover (or focus) a card for the detail. */
export default function Trust() {
  return (
    <Section id="trust">
      <SectionHead
        icon={faShieldHalved}
        eyebrow="Privacy and security"
        title="Yours, by"
        quiet="design."
        lead="How you sign in, who can see what, and how you take your work with you. Hover a card for the detail."
      />
      <Reveal stagger={0.08} className="mt-[clamp(28px,4vw,52px)] grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TRUST.map((t) => (
          <R key={t.t}>
            <Tip content={t.tip} className="flex h-full w-full">
              <Glass
                variant="flat"
                radius="r4"
                tone={t.tone}
                glare
                tilt
                lift
                className="flex h-full w-full flex-col gap-3 p-6"
                role="group"
                aria-label={t.t}
              >
                <IconTile icon={t.icon} />
                <h3 className="mt-1 text-[17px] font-semibold tracking-[-0.01em] text-fg">{t.t}</h3>
                <p className="text-[15px] leading-relaxed text-fg-muted">{t.d}</p>
              </Glass>
            </Tip>
          </R>
        ))}
      </Reveal>
      <Reveal className="mt-8 flex justify-center">
        <Link href="/privacy-security" className="btn btn-secondary" data-cursor="Read">
          Our privacy principles <FA icon={faArrowRight} />
        </Link>
      </Reveal>
    </Section>
  );
}
