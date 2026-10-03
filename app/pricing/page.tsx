import type { Metadata } from "next";
import Link from "next/link";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import { faArrowRight, faCheck, faKey, faPlug, faWallet, faBan } from "@fortawesome/free-solid-svg-icons";
import { PageHero, SectionHead, FeatureCards, CtaPanel } from "../../components/PageKit";
import { Reveal } from "../../components/Client";

export const metadata: Metadata = {
  title: "Pricing — untitled project",
  description: "A workspace plus Pro for more accounts and calendars. AI is never bundled — bring your own key, top up, or go AI-free.",
};

export default function Page() {
  return (
    <main>
      <PageHero eyebrow="Pricing" title="Pay for the workspace." quiet="Pay for AI only if you use it." lead="There’s no bundled AI subscription. Your workspace is one thing; the AI behind it is another — and you control both.">
        <Link className="btn btn-primary" href="/#start">Get started <FA icon={faArrowRight} /></Link>
      </PageHero>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <Reveal>
            <div className="plans">
              <div className="plan">
                <div className="eyebrow">Workspace</div>
                <h3 className="h3">Everything to start</h3>
                <div className="plan-price"><span>Pricing details</span><small>coming soon</small></div>
                <ul className="plan-pts">
                  {["Notes, to-do and journal", "Email and calendar", "Meetings and automations", "Import and export your work", "Use AI or keep it AI-free"].map((x) => <li key={x}><FA icon={faCheck} />{x}</li>)}
                </ul>
                <Link className="btn btn-secondary" href="/#start">Get started</Link>
              </div>
              <div className="plan" data-emphasis>
                <span className="plan-badge">Pro</span>
                <div className="eyebrow">Pro</div>
                <h3 className="h3">More accounts, more calendars</h3>
                <div className="plan-price"><span>Pricing details</span><small>coming soon</small></div>
                <ul className="plan-pts">
                  {["Everything in Workspace", "Up to 5 email accounts", "Up to 5 calendars", "Work and personal side by side", "Still no bundled AI subscription"].map((x) => <li key={x}><FA icon={faCheck} />{x}</li>)}
                </ul>
                <Link className="btn btn-primary" href="/#start">Get started with Pro</Link>
              </div>
            </div>
            <p className="meta" style={{ textAlign: "center", marginTop: 18 }}>Plan prices haven’t been announced yet. The limits shown are the ones published today.</p>
          </Reveal>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <SectionHead eyebrow="AI is separate" title="Four ways to power AI," quiet="or none at all." lead="Pick whatever suits you today and change it whenever you like. Your workspace content never moves." />
          <FeatureCards cols={4} items={[
            { icon: faPlug, t: "Use a supported AI account", d: "Connect an AI account you already have.", tone: "tone-blue" },
            { icon: faKey, t: "Bring your own API key", d: "Choose your model provider and connect it directly.", tone: "tone-violet" },
            { icon: faWallet, t: "Pay for usage when you need it", d: "Top up only when you need AI. No bundled AI subscription.", tone: "tone-amber" },
            { icon: faBan, t: "Take a break from AI", d: "Keep your workspace fully AI-free.", tone: "tone-clay" },
          ]} />
        </div>
      </section>

      <CtaPanel title="Questions about" quiet="plans?" lead="Start with the workspace and add Pro when you need more accounts and calendars." primary={["Get started", "/#start"]} secondary={["Read the FAQ", "/#faq"]} />
    </main>
  );
}
