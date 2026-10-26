import { serverConfigured } from "../../../server/session";
import { adminOverview } from "../../../server/services/billing/billing.service";
import { formatTokens } from "@untitled/logic/billing";
import SetupNotice from "../../../components/admin/SetupNotice";
import PlansEditor from "../../../components/admin/PlansEditor";
import SubscribersTable from "../../../components/admin/SubscribersTable";

export const dynamic = "force-dynamic";

const TONES = ["violet", "blue", "amber", "mint", "clay"];

export default async function Page() {
  if (!serverConfigured()) return <SetupNotice />;
  const { plans, totals, subscribers, tokens30d } = await adminOverview().catch(() => ({
    plans: null,
    totals: [],
    subscribers: [],
    tokens30d: 0,
  }));
  if (!plans)
    return (
      <div className="dash">
        <p className="form-err" role="alert">
          Couldn’t load plans. Make sure the latest database migration has been applied.
        </p>
      </div>
    );
  const people = (id: string) => totals.find((t) => t.plan_id === id)?.active ?? 0;

  return (
    <div className="dash">
      <div className="dash-head">
        <div>
          <div className="eyebrow">Plans</div>
          <h1 className="h2" style={{ marginTop: 8 }}>
            Prices, allowances and subscribers
          </h1>
          <p className="meta">
            Edit what each plan costs and includes. The pricing page and Settings read these rows, so a change shows everywhere at once.
            Nobody is charged automatically: no payment provider is connected yet.
          </p>
        </div>
      </div>
      <div className="dash-stats adm-six">
        {plans.map((p, i) => (
          <div className={`dash-stat at-${TONES[i % TONES.length]}`} key={p.id}>
            <b>{people(p.id)}</b>
            <small>{p.name}</small>
          </div>
        ))}
        <div className="dash-stat at-sand">
          <b>{formatTokens(tokens30d)}</b>
          <small>Tokens, last 30 days</small>
        </div>
      </div>
      <PlansEditor plans={plans} />
      <h2 className="h3" style={{ margin: "28px 0 12px" }}>
        Subscribers
      </h2>
      <SubscribersTable rows={subscribers} plans={plans} />
    </div>
  );
}
