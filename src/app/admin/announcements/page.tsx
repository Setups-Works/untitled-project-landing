import { serverConfigured, adminDb } from "../../../server/session";
import SetupNotice from "../../../components/admin/SetupNotice";
import Announcements, { type Announcement } from "../../../components/admin/Announcements";

export default async function Page() {
  if (!serverConfigured()) return <SetupNotice />;
  const { data, error } = await adminDb()
    .from("announcements")
    .select("id,message,tone,active,created_at")
    .order("created_at", { ascending: false })
    .limit(50);
  return (
    <div className="dash">
      <div className="dash-head">
        <div>
          <div className="eyebrow">Announcements</div>
          <h1 className="h2" style={{ marginTop: 8 }}>
            Tell your users something
          </h1>
        </div>
      </div>
      {error && (
        <p className="form-err" role="alert">
          Couldn’t load announcements. Make sure the latest database migration has been applied.
        </p>
      )}
      <Announcements items={(data ?? []) as Announcement[]} />
    </div>
  );
}
