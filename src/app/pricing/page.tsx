import type { Metadata } from "next";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import { faBan, faCheck, faKey, faPlug, faWallet } from "@fortawesome/free-solid-svg-icons";
import AuthLink from "../../components/auth/AuthLink";
import { CompareTable } from "../../components/landing/Blocks";
import { FaqList } from "../../components/landing/Faq";
import Glass from "../../components/landing/Glass";
import { BTN_LIGHT, Section } from "../../components/landing/Kit";
import { Magnetic } from "../../components/landing/Magnetic";
import { R, Reveal } from "../../components/landing/Reveal";
import { CtaPanel, FeatureCards, PageHero, SectionHead } from "../../components/PageKit";

export const metadata: Metadata = {
  title: "Pricing — untitled project",
  description: "A workspace plus Pro for more accounts and calendars. AI is never bundled: bring your own key, top up, or go AI-free.",
};

const workspace = [
  "Notes, tasks and journal",
  "Calendar and chat",
  "Universal search",
  "Import and export your work",
  "Use AI or keep it AI-free",
];
const pro = [
  "Everything in Workspace",
  "Up to 5 email accounts",
  "Up to 5 calendars",
  "Work and personal side by side",
  "Still no bundled AI subscription",
];

const faqs: [string, string][] = [
  [
    "When will prices be announced?",
    "Plan prices haven’t been announced yet. The limits on this page are the ones published today, and we’ll show the prices here before anything is charged.",
  ],
  [
    "Do I pay for AI?",
    "Only if you use it, and only directly. There is no bundled AI subscription: bring your own API key, connect an account you already have, or top up when you need it.",
  ],
  ["Can I use the workspace without AI at all?", "Yes. AI-free mode is always available, and the workspace works the same either way."],
];

function Plan({
  name,
  title,
  pts,
  emphasis = false,
  children,
}: {
  name: string;
  title: string;
  pts: string[];
  emphasis?: boolean;
  children: React.ReactNode;
}) {
  const body = (
    <Glass radius="r4" className="flex h-full flex-col gap-4 p-7 sm:p-9">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold tracking-[0.1em] text-fg-faint uppercase">{name}</span>
        {emphasis && <span className="rounded-pill bg-fg px-3 py-1 text-[12px] font-medium text-on-dark">Pro</span>}
      </div>
      <h3 className="font-serif text-[30px] leading-tight tracking-[-0.022em]">{title}</h3>
      <div className="flex items-baseline gap-2 border-y border-line py-4">
        <span className="font-serif text-[26px] tracking-[-0.02em] text-fg">Pricing details</span>
        <small className="text-[13px] text-fg-subtle">coming soon</small>
      </div>
      <ul className="flex flex-1 flex-col gap-3">
        {pts.map((x) => (
          <li key={x} className="flex items-center gap-3 text-[15px] text-fg">
            <FA icon={faCheck} className="text-[12px] text-green-fg" />
            {x}
          </li>
        ))}
      </ul>
      <div className="pt-2">{children}</div>
    </Glass>
  );
  // The emphasised plan gets a slowly shifting gradient edge.
  return emphasis ? (
    <div className="h-full animate-sheen rounded-r4 bg-[linear-gradient(120deg,var(--orb-1),var(--orb-2),var(--orb-3),var(--orb-1))] bg-[length:300%_100%] p-px motion-reduce:animate-none">
      {body}
    </div>
  ) : (
    body
  );
}

export default function Page() {
  return (
    <main>
      <PageHero
        eyebrow="Pricing"
        title="Pay for the workspace."
        quiet="Pay for AI only if you use it."
        lead="There’s no bundled AI subscription. Your workspace is one thing; the AI behind it is another, and you control both."
      >
        <Magnetic>
          <AuthLink arrow />
        </Magnetic>
      </PageHero>

      <Section tight>
        <Reveal stagger={0.14} className="grid gap-5 md:grid-cols-2">
          <R>
            <Plan name="Workspace" title="Everything to start" pts={workspace}>
              <AuthLink className="btn btn-secondary" />
            </Plan>
          </R>
          <R>
            <Plan name="Pro" title="More accounts, more calendars" pts={pro} emphasis>
              <Magnetic>
                <AuthLink className={BTN_LIGHT.replace("bg-white", "bg-fg").replace("text-fg", "text-on-dark")}>
                  Get started with Pro
                </AuthLink>
              </Magnetic>
            </Plan>
          </R>
        </Reveal>
        <p className="mt-5 text-center text-[13.5px] text-fg-subtle">
          Plan prices haven’t been announced yet. The limits shown are the ones published today.
        </p>
      </Section>

      <Section tight>
        <SectionHead eyebrow="Compare" title="What’s in" quiet="each plan." />
        <CompareTable
          plans={["Workspace", "Pro"]}
          rows={[
            { label: "Notes, tasks and journal", a: true, b: true },
            { label: "Calendar and chat", a: true, b: true },
            { label: "Universal search", a: true, b: true },
            { label: "Import and export", a: true, b: true },
            { label: "Connected email accounts", a: "Included", b: "Up to 5" },
            { label: "Connected calendars", a: "Included", b: "Up to 5" },
            { label: "Bring your own AI key", a: true, b: true },
            { label: "AI-free mode", a: true, b: true },
            { label: "Bundled AI subscription", a: false, b: false },
          ]}
        />
      </Section>

      <Section tight>
        <SectionHead
          eyebrow="AI is separate"
          title="Four ways to power AI,"
          quiet="or none at all."
          lead="Pick whatever suits you today and change it whenever you like. Your workspace content never moves."
        />
        <FeatureCards
          cols={4}
          items={[
            { icon: faPlug, t: "Use a supported AI account", d: "Connect an AI account you already have.", tone: "blue" },
            { icon: faKey, t: "Bring your own API key", d: "Choose your model provider and connect it directly.", tone: "violet" },
            {
              icon: faWallet,
              t: "Pay for usage when you need it",
              d: "Top up only when you need AI. No bundled AI subscription.",
              tone: "amber",
            },
            { icon: faBan, t: "Take a break from AI", d: "Keep your workspace fully AI-free.", tone: "clay" },
          ]}
        />
      </Section>

      <Section tight>
        <SectionHead eyebrow="Pricing FAQ" title="Straight" quiet="answers." />
        <div className="mx-auto mt-[clamp(28px,4vw,48px)] max-w-3xl">
          <FaqList items={faqs} />
        </div>
      </Section>

      <CtaPanel
        title="Questions about"
        quiet="plans?"
        lead="Start with the workspace and add Pro when you need more accounts and calendars."
        primary={["Get started", "/signup"]}
        secondary={["Read the FAQ", "/#faq"]}
      />
    </main>
  );
}
