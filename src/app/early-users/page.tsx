import type { Metadata } from "next";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import {
  faComments,
  faHandshake,
  faPenToSquare,
  faQuoteLeft,
  faSeedling,
  faUserPlus,
  faWandMagicSparkles,
} from "@fortawesome/free-solid-svg-icons";
import AuthLink from "../../components/auth/AuthLink";
import { StepCards } from "../../components/landing/Blocks";
import Glass from "../../components/landing/Glass";
import Roadmap from "../../components/landing/home/Roadmap";
import { Section } from "../../components/landing/Kit";
import { Magnetic } from "../../components/landing/Magnetic";
import { R, Reveal } from "../../components/landing/Reveal";
import { CtaPanel, FeatureCards, PageHero, SectionHead } from "../../components/PageKit";
import type { Tone } from "../../lib/tones";

export const metadata: Metadata = {
  title: "Early users — untitled project",
  description: "Be one of the first to shape untitled project. Early users get a direct line to the team.",
};

const slots: Tone[] = ["blue", "violet", "amber"];

const involve = [
  {
    icon: faUserPlus,
    tone: "green",
    t: "Sign up and look around",
    d: "Create an account and start with whatever you reach for first.",
    pts: ["Notes, tasks, journal, calendar and chat are live", "No AI needed"],
  },
  {
    icon: faPenToSquare,
    tone: "blue",
    t: "Use it for real work",
    d: "The most useful feedback comes from an ordinary week, not a tour.",
    pts: ["Move something you already track", "Note what you miss"],
  },
  {
    icon: faComments,
    tone: "violet",
    t: "Tell us what happened",
    d: "What worked, what didn’t, what you expected. Short is fine.",
    pts: ["Your words go straight to the team", "Quotes are published only with permission"],
  },
  {
    icon: faWandMagicSparkles,
    tone: "amber",
    t: "Watch it change",
    d: "What you tell us shapes the roadmap, and you’ll see it move.",
    pts: ["Roadmap statuses stay honest", "New features arrive marked live"],
  },
] as const;

export default function Page() {
  return (
    <main>
      <PageHero
        eyebrow="Early users"
        title="Built with the people"
        quiet="who use it first."
        lead="untitled project is in its early days. The first people to try it shape what it becomes, and we’ll share what they tell us right here."
      >
        <Magnetic>
          <AuthLink arrow />
        </Magnetic>
      </PageHero>

      <Section tight>
        <SectionHead
          eyebrow="What early users say"
          title="Their words,"
          quiet="not ours."
          lead="We only publish feedback from real people, with their permission. The first quotes will appear here as early users share them."
        />
        <Reveal stagger={0.12} className="mt-[clamp(28px,4vw,52px)] grid gap-4 md:grid-cols-3">
          {slots.map((t, n) => (
            <R key={n}>
              <Glass variant="flat" radius="r4" tone={t} glare tilt lift className="relative flex h-full flex-col gap-4 p-7">
                <span className="absolute top-5 right-5 rounded-pill bg-white/70 px-2.5 py-0.5 text-[11.5px] font-medium text-fg-muted">
                  Placeholder
                </span>
                <FA icon={faQuoteLeft} className="text-[26px] text-(--abf)/40" />
                <blockquote className="font-serif text-[22px] leading-snug tracking-[-0.015em] text-fg">
                  Your feedback could be the first quote on this page.
                </blockquote>
                <figcaption className="mt-auto flex items-center gap-3">
                  <span aria-hidden className="size-10 rounded-full bg-white/70 shadow-glass" />
                  <span>
                    <b className="block text-[14.5px] font-semibold text-fg">Early user</b>
                    <small className="text-[12.5px] text-fg-subtle">Name and role added with permission</small>
                  </span>
                </figcaption>
              </Glass>
            </R>
          ))}
        </Reveal>
      </Section>

      <Section tight>
        <SectionHead eyebrow="Taking part" title="Four small steps," quiet="no commitment." />
        <StepCards steps={involve} />
      </Section>

      <Section tight>
        <SectionHead eyebrow="Why join early" title="A direct line" quiet="to the team." />
        <FeatureCards
          items={[
            {
              icon: faSeedling,
              t: "Shape the product",
              d: "Tell us what’s missing. Early feedback decides what we build next.",
              tone: "green",
            },
            { icon: faComments, t: "Talk to the people building it", d: "Your questions and ideas go straight to the team.", tone: "blue" },
            {
              icon: faHandshake,
              t: "Grow with it",
              d: "Start with notes and connect the rest of your tools as they arrive.",
              tone: "amber",
            },
          ]}
        />
      </Section>

      <Roadmap />

      <CtaPanel
        title="Be one of"
        quiet="the first."
        lead="Start with the notes, connect your tools as they arrive, and tell us what you think."
        secondary={["See the product demo", "/demo"]}
      />
    </main>
  );
}
