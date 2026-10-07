import type { Metadata } from "next";
import type { ReactNode } from "react";
import { requireAdmin, serverConfigured } from "../../server/session";
import AdminNav from "../../components/admin/AdminNav";

export const metadata: Metadata = { title: "Admin — untitled project", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function Layout({ children }: { children: ReactNode }) {
  if (!serverConfigured())
    return (
      <main className="section">
        <div className="container" style={{ maxWidth: 640 }}>
          <div className="panel" data-tone="amber">
            <p className="body">
              The server isn’t connected yet. Run <code>docker compose up -d</code> and copy <code>.env.example</code> to{" "}
              <code>.env.local</code>.
            </p>
          </div>
        </div>
      </main>
    );
  const user = await requireAdmin();
  return (
    <div className="adm">
      <AdminNav email={user.email} />
      <div className="adm-main">{children}</div>
    </div>
  );
}
