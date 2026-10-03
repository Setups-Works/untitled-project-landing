import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import { faArrowRight, faCircleCheck, faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import { supabaseConfigured } from "../../lib/supabase/config";
import { supabaseServer } from "../../lib/supabase/server";
import SignOut from "../../components/auth/SignOut";

export const metadata: Metadata = { title: "Dashboard — untitled project", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function Page() {
  if (!supabaseConfigured)
    return (
      <main className="section">
        <div className="container" style={{ maxWidth: 640 }}>
          <div className="panel" data-tone="amber">
            <p className="au-note"><FA icon={faTriangleExclamation} /> Supabase isn’t connected yet. Add your project keys to <code>.env.local</code> and restart.</p>
          </div>
        </div>
      </main>
    );
  const sb = await supabaseServer();
  const { data } = await sb.auth.getUser();
  if (!data.user) redirect("/login?next=/dashboard");
  const name = (data.user.user_metadata?.full_name as string | undefined)?.split(" ")[0];
  return (
    <main className="section" style={{ paddingTop: 48 }}>
      <div className="container" style={{ maxWidth: 880 }}>
        <div className="panel" data-tone="violet">
          <span className="au-ico"><FA icon={faCircleCheck} /></span>
          <h1 className="h2" style={{ margin: "14px 0 8px" }}>Welcome{name ? `, ${name}` : ""}.</h1>
          <p className="lead">You’re signed in as <b>{data.user.email}</b>. Your workspace is being built — in the meantime, explore what’s coming.</p>
          <div className="cta" style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 24 }}>
            <Link className="btn btn-primary" href="/demo">Open the product demo <FA icon={faArrowRight} /></Link>
            <SignOut />
          </div>
        </div>
      </div>
    </main>
  );
}
