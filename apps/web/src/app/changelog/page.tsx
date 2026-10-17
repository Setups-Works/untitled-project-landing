import type { Metadata } from "next";
import ClientOnly from "../../components/app/ClientOnly";
import { Section } from "../../components/landing/Kit";
import { CtaPanel, PageHero } from "../../components/PageKit";
import Changelog from "../../features/changelog/Changelog";

export const metadata: Metadata = {
  title: "Changelog — untitled project",
  description: "What’s new in the web app and the Android app, newest first.",
};

export default function Page() {
  return (
    <main>
      <PageHero
        eyebrow="Changelog"
        title="What’s new,"
        quiet="newest first."
        lead="Every change people can see, in the web app and the Android app. App releases link to their download on GitHub."
      />
      <Section tight>
        <ClientOnly>
          <Changelog />
        </ClientOnly>
      </Section>
      <CtaPanel
        title="Want to shape"
        quiet="what ships next?"
        lead="Early users get a direct line to the team, and what you tell us shows up here."
        primary={["Get started", "/signup"]}
        secondary={["Early users", "/early-users"]}
      />
    </main>
  );
}
