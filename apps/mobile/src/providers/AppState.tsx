import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";

import { readOnboardingDone, writeOnboardingDone } from "@/features/onboarding/storage";
import { cleanSettingsPrefs, DEFAULT_SETTINGS_PREFS, updateRuntimePrefs, type SettingsPrefs } from "@/lib/preferences";
import { api } from "@/lib/api";
import { authClient, type MobileAuthClient } from "@/lib/auth-client";

type SessionUser = { id: string; name: string; email: string; image?: string | null; username?: string | null };

type AppStateValue = {
  /** False until both the stored session and the onboarding flag are known, so no screen flashes before the redirect. */
  ready: boolean;
  onboardingDone: boolean;
  signedIn: boolean;
  user: SessionUser | null;
  preferences: SettingsPrefs;
  preferencesReady: boolean;
  setPreferences: Dispatch<SetStateAction<SettingsPrefs>>;
  completeOnboarding: () => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AppStateValue | null>(null);

export function useAppState() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAppState must be used inside <AppStateProvider>.");
  return v;
}

/** The configured client; screens only render when it exists (see the setup screen in the root layout). */
export function useAuth(): MobileAuthClient {
  if (!authClient) throw new Error("The API address is not configured.");
  return authClient;
}

function Inner({ client, children }: { client: MobileAuthClient; children: ReactNode }) {
  const { data, isPending } = client.useSession();
  const [onboardingDone, setOnboardingDone] = useState(false);
  const [onboardingLoaded, setOnboardingLoaded] = useState(false);
  const [preferences, setPreferences] = useState<SettingsPrefs>(DEFAULT_SETTINGS_PREFS);
  const [preferencesUserId, setPreferencesUserId] = useState<string | null>(null);
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 15_000 } } }));

  useEffect(() => {
    void readOnboardingDone().then((done) => {
      setOnboardingDone(done);
      setOnboardingLoaded(true);
    });
  }, []);

  const userId = data?.user.id ?? null;
  useEffect(() => {
    let active = true;
    if (!userId) return () => { active = false; };
    void api.get<{ data: { preferences: unknown } }>("/api/v1/account/settings")
      .then((response) => {
        if (active) {
          setPreferences(cleanSettingsPrefs(response.data.preferences));
          setPreferencesUserId(userId);
        }
      })
      .catch(() => {
        if (active) {
          setPreferences(DEFAULT_SETTINGS_PREFS);
          setPreferencesUserId(userId);
        }
      });
    return () => { active = false; };
  }, [userId]);

  const preferencesReady = !userId || preferencesUserId === userId;
  const activePreferences = userId && preferencesUserId === userId ? preferences : DEFAULT_SETTINGS_PREFS;
  useEffect(() => updateRuntimePrefs(activePreferences), [activePreferences]);
  useEffect(() => {
    // Another account must never see the previous account's cached lists.
    if (!userId) queryClient.clear();
  }, [userId, queryClient]);

  const completeOnboarding = useCallback(async () => {
    setOnboardingDone(true);
    await writeOnboardingDone();
  }, []);

  const signOut = useCallback(async () => {
    await client.signOut().catch(() => undefined);
    queryClient.clear();
  }, [client, queryClient]);

  const value = useMemo<AppStateValue>(
    () => ({
      ready: !isPending && onboardingLoaded,
      onboardingDone,
      signedIn: Boolean(data?.user),
      user: data?.user
        ? {
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            image: data.user.image,
            username: (data.user as { username?: string | null }).username ?? null,
          }
        : null,
      preferences: activePreferences,
      preferencesReady,
      setPreferences,
      completeOnboarding,
      signOut,
    }),
    [isPending, onboardingLoaded, onboardingDone, data, activePreferences, preferencesReady, completeOnboarding, signOut],
  );

  return (
    <QueryClientProvider client={queryClient}>
      <Ctx.Provider value={value}>{children}</Ctx.Provider>
    </QueryClientProvider>
  );
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  if (!authClient) return <>{children}</>;
  return <Inner client={authClient}>{children}</Inner>;
}
