import type { Metadata } from "next";
import type { ReactNode } from "react";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import { faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import { redirect } from "next/navigation";
import { supabaseConfigured } from "../../lib/supabase/config";
import { currentUser, isAdmin } from "../../lib/supabase/admin";
import { CATEGORIES } from "../../lib/notes";
import { cleanPrefs } from "../../lib/prefs";
import { supabaseServer } from "../../lib/supabase/server";
import AppNav from "../../components/app/AppNav";
import AnnouncementBanner from "../../components/app/AnnouncementBanner";

export const metadata: Metadata = { title: "Dashboard — untitled project", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function Layout({ children }: { children: ReactNode }) {
  if (!supabaseConfigured)
    return (
      <main className="section">
        <div className="container" style={{ maxWidth: 640 }}>
          <div className="panel" data-tone="amber">
            <p className="au-note"><FA icon={faTriangleExclamation} /> <span>Supabase isn’t connected yet. Add your project keys to <code>.env.local</code> and restart.</span></p>
          </div>
        </div>
      </main>
    );
  const user = await currentUser();
  if (!user) redirect("/login?next=/dashboard");
  const name = (user.user_metadata?.full_name as string | undefined) || (user.email ?? "").split("@")[0];
  const providers = (user.app_metadata?.providers as string[] | undefined) ?? [String(user.app_metadata?.provider || "email")];
  // Active admin announcements (readable by any signed-in user via RLS). A failure here must never break the app.
  let announcements: { id: string; message: string; tone: string }[] = [];
  try {
    const { data } = await (await supabaseServer()).from("announcements").select("id,message,tone").eq("active", true).order("created_at", { ascending: false }).limit(3);
    announcements = data ?? [];
  } catch { /* ignore */ }
  return (
    <div className="ap">
      <AppNav
        name={name}
        email={user.email ?? ""}
        admin={isAdmin(user)}
        prefs={cleanPrefs(user.user_metadata?.preferences, CATEGORIES)}
        account={{
          name: (user.user_metadata?.full_name as string | undefined) ?? "",
          email: user.email ?? "",
          hasPassword: providers.includes("email"),
          providers,
          createdAt: user.created_at,
          avatarUrl: (user.user_metadata?.avatar_url as string | null | undefined) ?? null,
          lastSignIn: user.last_sign_in_at ?? null,
        }}
      />
      <AnnouncementBanner items={announcements} />
      <div className="ap-body">{children}</div>
    </div>
  );
}
