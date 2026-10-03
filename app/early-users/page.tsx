import type { Metadata } from "next";
import Link from "next/link";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import { faArrowRight, faQuoteLeft, faComments, faHandshake, faSeedling } from "@fortawesome/free-solid-svg-icons";
import { PageHero, SectionHead, FeatureCards, CtaPanel } from "../../components/PageKit";
import { Reveal } from "../../components/Client";

export const metadata: Metadata = {
  title: "Early users — untitled project",
  description: "Be one of the first to shape untitled project. Early users get a direct line to the team.",
};

const slots = ["blue", "violet", "amber"];

export default function Page() {
  return (
    <main>
      <PageHero eyebrow="Early users" title="Built with the people" quiet="who use it first." lead="untitled project is in its early days. The first people to try it shape what it becomes — and we’ll share what they tell us right here.">
        <Link className="btn btn-primary" href="/waitlist">Join the waitlist <FA icon={faArrowRight} /></Link>
      </PageHero>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <SectionHead eyebrow="What early users say" title="Their words," quiet="not ours." lead="We only publish feedback from real people, with their permission. The first quotes will appear here as early users share them." />
          <Reveal>
            <div className="quotes">
              {slots.map((t, n) => (
                <figure className={`quote at-${t}`} key={n}>
                  <span className="quote-tag">Placeholder</span>
                  <FA icon={faQuoteLeft} className="quote-mark" />
                  <blockquote>Your feedback could be the first quote on this page.</blockquote>
                  <figcaption>
                    <span className="quote-av" aria-hidden />
                    <span><b>Early user</b><small>Name and role added with permission</small></span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <SectionHead eyebrow="Why join early" title="A direct line" quiet="to the team." />
          <FeatureCards items={[
            { icon: faSeedling, t: "Shape the product", d: "Tell us what’s missing. Early feedback decides what we build next.", tone: "tone-green" },
            { icon: faComments, t: "Talk to the people building it", d: "Your questions and ideas go straight to the team.", tone: "tone-blue" },
            { icon: faHandshake, t: "Grow with it", d: "Start with notes and connect the rest of your tools as they arrive.", tone: "tone-amber" },
          ]} />
        </div>
      </section>

      <CtaPanel title="Be one of" quiet="the first." lead="Start with the notes, connect Gmail and Google Calendar, and tell us what you think." secondary={["See the product demo", "/demo"]} />
    </main>
  );
}
