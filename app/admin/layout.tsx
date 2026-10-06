import type { Metadata } from "next";
import type { ReactNode } from "react";
import { requireAdmin } from "../../lib/supabase/admin";
import { supabaseConfigured } from "../../lib/supabase/config";
import AdminNav from "../../components/admin/AdminNav";

export const metadata: Metadata = { title: "Admin — untitled project", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function Layout({ children }: { children: ReactNode }) {
  if (!supabaseConfigured)
    return (
      <main className="section"><div className="container" style={{ maxWidth: 640 }}>
        <div className="panel" data-tone="amber"><p className="body">Supabase isn’t connected yet. Add your keys to <code>.env.local</code> and restart.</p></div>
      </div></main>
    );
  const user = await requireAdmin();
  return (
    <div className="adm">
      <AdminNav email={user.email ?? ""} />
      <div className="adm-main">{children}</div>
    </div>
  );
}
