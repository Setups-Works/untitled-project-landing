import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AdminLogin from "../../../components/forms/AdminLogin";
import { currentAdmin } from "../../../lib/auth";

export const metadata: Metadata = { title: "Admin sign in — untitled project", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function Page() {
  if (await currentAdmin()) redirect("/admin");
  return (
    <main className="section">
      <div className="container" style={{ maxWidth: 520 }}>
        <div className="panel" data-tone="violet">
          <div className="eyebrow">Admin</div>
          <h1 className="h2" style={{ margin: "12px 0 22px" }}>Sign in</h1>
          <AdminLogin />
        </div>
      </div>
    </main>
  );
}
