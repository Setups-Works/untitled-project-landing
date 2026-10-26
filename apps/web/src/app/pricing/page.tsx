import type { Metadata } from "next";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import { faBan, faCheck, faCoins, faKey, faWallet } from "@fortawesome/free-solid-svg-icons";
import type { BillingPlan } from "@untitled/types";
import { formatTokens, priceLine } from "@untitled/logic/billing";
import AuthLink from "../../components/auth/AuthLink";
import { CompareTable } from "../../components/landing/Blocks";
import { FaqList } from "../../components/landing/Faq";
import Glass from "../../components/landing/Glass";
import { BTN_LIGHT, Section } from "../../components/landing/Kit";
import { Magnetic } from "../../components/landing/Magnetic";
import { R, Reveal } from "../../components/landing/Reveal";
import { CtaPanel, FeatureCards, PageHero, SectionHead } from "../../components/PageKit";
import { isEnabled } from "../../config/features";
import { listPublicPlans } from "../../server/services/billing/billing.service";

// Prices and allowances are edited in Admin → Plans, so this page reads them on every request instead of baking them in at build time.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pricing — untitled project",
  description: "One workspace, three ways to pay for AI: a subscription, pay as you go, or your own API key. Change or cancel any time.",
};

function Plan({ plan, emphasis = false }: { plan: BillingPlan; emphasis?: boolean }) {
  const body = (
    <Glass radius="r4" className="flex h-full flex-col gap-4 p-7 sm:p-9">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold tracking-[0.1em] text-fg-faint uppercase">{plan.name}</span>
        {emphasis && <span className="rounded-pill bg-fg px-3 py-1 text-[12px] font-medium text-on-dark">Popular</span>}
      </div>
      <h3 className="font-serif text-[30px] leading-tight tracking-[-0.022em]">{priceLine(plan)}</h3>
      <p className="m-0 border-y border-line py-4 text-[15px] text-fg-muted">{plan.tagline}</p>
      <ul className="flex flex-1 flex-col gap-3">
        {plan.features.map((x) => (
          <li key={x} className="flex items-center gap-3 text-[15px] text-fg">
            <FA icon={faCheck} className="text-[12px] text-green-fg" />
            {x}
          </li>
        ))}
      </ul>
      <div className="pt-2">
        {emphasis ? (
          <Magnetic>
            <AuthLink className={BTN_LIGHT.replace("bg-white", "bg-fg").replace("text-fg", "text-on-dark")}>Get started</AuthLink>
          </Magnetic>
        ) : (
          <AuthLink className="btn btn-secondary" />
        )}
      </div>
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

/** What each plan means for AI, worked out from the plan's own numbers. */
const aiLine = (p: BillingPlan) =>
  p.id === "subscription"
    ? p.included_tokens > 0
      ? `${formatTokens(p.included_tokens)} tokens a month`
      : "Included"
    : p.id === "payg"
      ? "Billed by use"
      : "Your own provider";

export default async function Page() {
  const plans = await listPublicPlans().catch(() => [] as BillingPlan[]);
  const live = isEnabled("payments");

  const faqs: [string, string][] = [
    [
      "Can I cancel or switch any time?",
      "Yes. Change plans or cancel from Settings whenever you like. A subscription runs to the end of the month you are in; the other plans stop right away.",
    ],
    [
      "What do I pay for AI?",
      "It depends on the plan. A subscription includes a monthly allowance of AI tokens. Pay as you go has no monthly fee and bills the tokens you use. With your own key you pay your AI provider directly and we don’t meter anything.",
    ],
    [
      "Where is my API key kept?",
      "Encrypted on our server, and only used to answer your own requests. It is never shown again, and you can remove it whenever you like.",
    ],
    [
      live ? "How do I pay?" : "Is anyone being charged yet?",
      live
        ? "You choose a plan in Settings and pay through our payment provider."
        : "Not yet. Plans can be chosen in Settings, but payments aren’t switched on, so nobody is charged until we say so on this page.",
    ],
    ["Can I use the workspace without AI at all?", "Yes. AI-free mode is always available, and the workspace works the same either way."],
  ];

  return (
    <main>
      <PageHero
        eyebrow="Pricing"
        title="Pick how you pay"
        quiet="for AI."
        lead="Your workspace is one thing; the AI behind it is another. Choose a subscription, pay for what you use, or bring your own key, and change or cancel any time."
      >
        <Magnetic>
          <AuthLink arrow />
        </Magnetic>
      </PageHero>

      <Section tight>
        {plans.length > 0 ? (
          <Reveal stagger={0.14} className="grid gap-5 md:grid-cols-3">
            {plans.map((p, i) => (
              <R key={p.id}>
                <Plan plan={p} emphasis={i === 0} />
              </R>
            ))}
          </Reveal>
        ) : (
          <p className="text-center text-[15px] text-fg-subtle">Plans are being updated. Check back in a moment.</p>
        )}
        {!live && plans.length > 0 && (
          <p className="mt-5 text-center text-[13.5px] text-fg-subtle">
            Payments aren’t switched on yet, so choosing a plan doesn’t charge you.
          </p>
        )}
      </Section>

      {plans.length > 0 && (
        <Section tight>
          <SectionHead eyebrow="Compare" title="What’s in" quiet="each plan." />
          <CompareTable
            plans={plans.map((p) => p.name)}
            rows={[
              { label: "Notes, tasks and journal", values: plans.map(() => true) },
              { label: "Calendar, chat and Reader", values: plans.map(() => true) },
              { label: "Price", values: plans.map(priceLine) },
              { label: "AI", values: plans.map(aiLine) },
              { label: "You pay your AI provider directly", values: plans.map((p) => p.id === "byo") },
              { label: "AI-free mode", values: plans.map(() => true) },
              { label: "Cancel any time", values: plans.map(() => true) },
            ]}
          />
        </Section>
      )}

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
            { icon: faWallet, t: "Subscription", d: "One monthly price with an AI allowance included.", tone: "amber" },
            { icon: faCoins, t: "Pay as you go", d: "No monthly fee. Pay only for the tokens you use.", tone: "blue" },
            { icon: faKey, t: "Bring your own API key", d: "Connect your own provider and pay them directly.", tone: "violet" },
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
        lead="Start with the workspace and pick a plan whenever you need AI."
        primary={["Get started", "/signup"]}
        secondary={["Read the FAQ", "/#faq"]}
      />
    </main>
  );
}
