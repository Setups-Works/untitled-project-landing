import type { Metadata } from "next";
import type { ReactNode } from "react";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import { faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import { redirect } from "next/navigation";
import { accountInfo, currentUser, isAdmin, serverConfigured, userDb } from "../../server/session";
import { CATEGORIES } from "../../lib/notes";
import { cleanPrefs } from "../../lib/prefs";
import AppNav from "../../components/app/AppNav";
import QueryProvider from "../../components/providers/QueryProvider";
import AnnouncementBanner from "../../components/app/AnnouncementBanner";
import Onboarding from "../../components/app/Onboarding";
import { cleanOnboarding, shouldShowOnboarding } from "../../lib/onboarding";

export const metadata: Metadata = { title: "Dashboard — untitled project", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function Layout({ children }: { children: ReactNode }) {
  if (!serverConfigured())
    return (
      <main className="section">
        <div className="container" style={{ maxWidth: 640 }}>
          <div className="panel" data-tone="amber">
            <p className="au-note">
              <FA icon={faTriangleExclamation} />{" "}
              <span>
                The server isn’t connected yet. Run <code>docker compose up -d</code>, copy <code>.env.example</code> to{" "}
                <code>.env.local</code> and restart.
              </span>
            </p>
          </div>
        </div>
      </main>
    );
  const user = await currentUser();
  if (!user) redirect("/login?next=/dashboard");
  const name = user.name || user.email.split("@")[0];
  const db = userDb(user.id);
  // Settings, onboarding progress and announcements are read with the user's own permissions. A failure must never break the app.
  const [profile, ann, info] = await Promise.all([
    db.from("profiles").select("preferences,onboarding").maybeSingle(),
    db.from("announcements").select("id,message,tone").eq("active", true).order("created_at", { ascending: false }).limit(3),
    accountInfo(user.id),
  ]);
  const announcements = (ann.data ?? []) as { id: string; message: string; tone: string }[];
  const prefs = cleanPrefs(profile.data?.preferences, CATEGORIES);
  const onboarding = cleanOnboarding(profile.data?.onboarding);
  return (
    <QueryProvider>
      <div className="ap">
        <AppNav
          name={name}
          email={user.email}
          admin={isAdmin(user)}
          prefs={prefs}
          account={{
            name: user.name,
            email: user.email,
            username: user.username ?? null,
            displayUsername: user.displayUsername ?? null,
            hasPassword: info.providers.includes("email"),
            providers: info.providers,
            createdAt: user.createdAt,
            avatarUrl: user.image,
            lastSignIn: info.lastSignIn,
          }}
        />
        <AnnouncementBanner items={announcements} />
        <div className="ap-body">{children}</div>
        <Onboarding name={name} prefs={prefs} state={onboarding} show={shouldShowOnboarding(onboarding)} />
      </div>
    </QueryProvider>
  );
}
