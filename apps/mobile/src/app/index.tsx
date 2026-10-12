import { Redirect } from "expo-router";

import { useAppState } from "@/providers/AppState";

/** Decides the first screen from onboarding and session state. The root layout holds the splash until both are known. */
export default function Index() {
  const { ready, onboardingDone, signedIn } = useAppState();
  if (!ready) return null;
  if (!onboardingDone) return <Redirect href="/welcome" />;
  if (!signedIn) return <Redirect href="/login" />;
  return <Redirect href="/home" />;
}
