import AuthLink from "../components/auth/AuthLink";
import { ALL_INTEGRATIONS, FAQS, GROUPS } from "../components/landing/content";
import { FaqList } from "../components/landing/Faq";
import { IntegrationsCarousel } from "../components/landing/IntegrationsCarousel";
import { Eyebrow, Lead, Section, SectionHead, Title } from "../components/landing/Kit";
import { Logo } from "../components/landing/Logo";
import { Magnetic } from "../components/landing/Magnetic";
import { Marquee } from "../components/landing/Marquee";
import { Reveal } from "../components/landing/Reveal";
import { Tip } from "../components/landing/Tip";
import AiSection from "../components/landing/home/AiSection";
import Bento from "../components/landing/home/Bento";
import DeepDives from "../components/landing/home/DeepDives";
import Hero from "../components/landing/home/Hero";
import Pro from "../components/landing/home/Pro";
import Speed from "../components/landing/home/Speed";
import Trust from "../components/landing/home/Trust";
import Why from "../components/landing/home/Why";
import { CtaPanel } from "../components/PageKit";
import { isLive } from "../lib/logos";

export default function Page() {
  return (
    <main>
      <Hero />

      <section aria-label="Integrations" className="py-6">
        <Marquee speed={55}>
          {ALL_INTEGRATIONS.map((n) => (
            <Tip key={n} content={isLive(n) ? `${n} works with your workspace.` : `${n} is planned. We’ll mark it live when it ships.`}>
              <span
                className={`liquid-pill inline-flex items-center gap-2.5 rounded-pill px-4 py-2.5 text-[14px] text-fg ${isLive(n) ? "" : "opacity-70"}`}
              >
                <Logo name={n} size={18} />
                {n}
                {!isLive(n) && <em className="rounded-pill bg-surface-sunken px-2 py-0.5 text-[11px] text-fg-muted not-italic">Soon</em>}
              </span>
            </Tip>
          ))}
        </Marquee>
      </section>

      <Why />
      <Bento />
      <DeepDives />

      <Section id="integrations">
        <SectionHead
          eyebrow="Integrations"
          title="Connect the tools"
          quiet="you already use."
          lead="From inbox to issue tracker, and a model that can grow to the rest. Each one says whether it’s live."
        />
        <div className="mt-[clamp(28px,4vw,48px)]">
          <IntegrationsCarousel groups={GROUPS} />
        </div>
      </Section>

      <Speed />
      <AiSection />

      <Trust />
      <Pro />

      <Section id="faq">
        <div className="grid items-start gap-[clamp(28px,5vw,72px)] lg:grid-cols-[0.8fr_1.2fr]">
          <div className="flex flex-col items-start gap-5 lg:sticky lg:top-28">
            <Reveal>
              <Eyebrow>FAQ</Eyebrow>
            </Reveal>
            <Title quiet="questions.">Good</Title>
            <Reveal delay={150}>
              <Lead>Quick answers about AI, accounts and your data. Still unsure? Start with the notes and connect the rest later.</Lead>
            </Reveal>
            <Reveal delay={250}>
              <Magnetic>
                <AuthLink arrow />
              </Magnetic>
            </Reveal>
          </div>
          <FaqList items={FAQS} />
        </div>
      </Section>

      <CtaPanel
        title="Bring it all"
        quiet="together."
        lead="One workspace for personal and work information. Start with the notes, and connect the rest when you’re ready."
        secondary={["Browse integrations", "/#integrations"]}
      />
    </main>
  );
}
