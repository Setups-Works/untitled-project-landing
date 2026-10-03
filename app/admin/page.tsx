import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { collections } from "../../lib/mongo";
import { currentAdmin } from "../../lib/auth";
import Dashboard from "../../components/forms/Dashboard";

export const metadata: Metadata = { title: "Admin — untitled project", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function Page() {
  const admin = await currentAdmin();
  if (!admin) redirect("/admin/login");
  const { waitlist, surveys } = await collections();
  const [w, s] = await Promise.all([
    waitlist.find().sort({ createdAt: -1 }).limit(2000).toArray(),
    surveys.find().sort({ createdAt: -1 }).limit(2000).toArray(),
  ]);
  const ser = (d: Record<string, unknown>) => ({ ...d, _id: String(d._id), createdAt: (d.createdAt as Date).toISOString() });
  return (
    <main className="section" style={{ paddingTop: 40 }}>
      <div className="container">
        <Dashboard email={admin.email} waitlist={w.map(ser) as never} surveys={s.map(ser) as never} />
      </div>
    </main>
  );
}
