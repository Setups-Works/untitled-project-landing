import type { Metadata } from "next";
import { faMagnifyingGlass, faLayerGroup, faFilter, faBolt } from "@fortawesome/free-solid-svg-icons";
import { PageHero, SectionHead, FeatureCards, CtaPanel } from "../../components/PageKit";
import SearchDemo from "../../components/demos/SearchDemo";
import { Reveal } from "../../components/Client";

export const metadata: Metadata = {
  title: "Universal Search — untitled project",
  description: "Find anything across your notes, tasks, journal, email, calendar and meetings from one search box.",
};

export default function Page() {
  return (
    <main>
      <PageHero
        eyebrow="Universal Search"
        title="Find anything,"
        quiet="wherever it lives."
        lead="One search box for your notes, tasks, journal, email, calendar and meetings — and the documents you’ve connected. No more guessing which app it was in."
      >
        <a className="btn btn-primary" href="#try">
          Try the search
        </a>
      </PageHero>

      <section className="section" id="try" style={{ paddingTop: 0 }}>
        <div className="container">
          <Reveal>
            <div className="panel" data-tone="blue">
              <SearchDemo />
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <SectionHead eyebrow="Why it matters" title="Your work isn’t in one app." quiet="Your search should be." />
          <FeatureCards
            items={[
              {
                icon: faLayerGroup,
                t: "Everything in one index",
                d: "Notes, tasks, journal entries, email threads, events and meetings show up together.",
                tone: "tone-blue",
              },
              {
                icon: faFilter,
                t: "Narrow by type",
                d: "Filter to just notes, just mail or just meetings when you know what you’re after.",
                tone: "tone-amber",
              },
              {
                icon: faMagnifyingGlass,
                t: "Context at a glance",
                d: "Results show where each item lives and what it’s connected to.",
                tone: "tone-violet",
              },
              {
                icon: faBolt,
                t: "No AI required",
                d: "Search works the same with AI on or off. Your content stays in your workspace.",
                tone: "tone-clay",
              },
            ]}
            cols={4}
          />
        </div>
      </section>

      <CtaPanel
        title="Stop hunting."
        quiet="Start finding."
        lead="Bring your notes, mail and calendar into one workspace and search them together."
        secondary={["See how it works", "/how-it-works"]}
      />
    </main>
  );
}
