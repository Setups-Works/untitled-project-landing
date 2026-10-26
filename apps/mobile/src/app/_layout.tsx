import { useWidgetSync } from "@/features/widgets";
import { Geist_400Regular, Geist_500Medium, Geist_600SemiBold } from "@expo-google-fonts/geist";
import { InstrumentSerif_400Regular, InstrumentSerif_400Regular_Italic } from "@expo-google-fonts/instrument-serif";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AnimatedSplash } from "@/components/AnimatedSplash";
import { AppText } from "@/components/ui/AppText";
import { Screen } from "@/components/ui/Screen";
import { Palette } from "@/constants/theme";
import { mobileEnv } from "@/config/env";
import { UpdateProvider } from "@/features/updates/UpdateProvider";
import { AppStateProvider, useAppState } from "@/providers/AppState";

void SplashScreen.preventAutoHideAsync();

export { ErrorBoundary } from "expo-router";

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Geist_400Regular,
    Geist_500Medium,
    Geist_600SemiBold,
    InstrumentSerif_400Regular,
    InstrumentSerif_400Regular_Italic,
  });
  const fontsReady = fontsLoaded || fontError !== null;

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        {!mobileEnv.apiBaseUrl ? (
          <>
            <SetupNotice />
            <AnimatedSplash ready />
          </>
        ) : (
          <AppStateProvider>
            <UpdateProvider>{fontsReady ? <Routes /> : null}</UpdateProvider>
            <SplashGate fontsReady={fontsReady} />
          </AppStateProvider>
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/** The animated splash covers the app until fonts and the stored session and onboarding flag are read, so no wrong screen flashes. */
function SplashGate({ fontsReady }: { fontsReady: boolean }) {
  const { ready } = useAppState();
  return <AnimatedSplash ready={fontsReady && ready} />;
}

/** Declarative guards: a screen in a group whose `guard` is false cannot be reached, and the router falls back to `index`. */
function Routes() {
  const { ready, onboardingDone, signedIn } = useAppState();
  // Keeps the home-screen widgets in step with the app (and wipes them on sign-out).
  useWidgetSync(signedIn);

  if (!ready) return null;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Palette.page } }}>
      <Stack.Screen name="index" />
      <Stack.Protected guard={!onboardingDone}>
        <Stack.Screen name="(onboarding)" />
      </Stack.Protected>
      <Stack.Protected guard={onboardingDone && !signedIn}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="note/[id]"
          options={{
            presentation: "formSheet",
            sheetAllowedDetents: [0.82, 1],
            sheetInitialDetentIndex: 1,
            sheetGrabberVisible: true,
            sheetCornerRadius: 28,
          }}
        />
        <Stack.Screen
          name="journal/[id]"
          options={{
            presentation: "formSheet",
            sheetAllowedDetents: [0.82, 1],
            sheetInitialDetentIndex: 1,
            sheetGrabberVisible: true,
            sheetCornerRadius: 28,
          }}
        />
        <Stack.Screen name="journal/collaborate" />
        <Stack.Screen name="journal/shared/[id]" />
        <Stack.Screen name="task/[id]" options={{ presentation: "modal" }} />
        <Stack.Screen name="reader/[id]" options={{ presentation: "modal" }} />
        <Stack.Screen name="health/[metric]" options={{ presentation: "modal" }} />
        <Stack.Screen name="profile" options={{ presentation: "modal" }} />
        <Stack.Screen name="pricing" options={{ presentation: "modal" }} />
      </Stack.Protected>
    </Stack>
  );
}

function SetupNotice() {
  return (
    <View style={styles.root}>
      <Screen scroll={false} contentStyle={styles.setup}>
        <AppText variant="label">untitled project</AppText>
        <AppText variant="title">Connect your workspace</AppText>
        <AppText variant="body" color={Palette.fgMuted}>
          Set EXPO_PUBLIC_API_URL in apps/mobile/.env.local to the web app’s address, then restart Expo. On a physical phone use your
          computer’s LAN address, not localhost.
        </AppText>
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.page },
  setup: { flex: 1, justifyContent: "center" },
});
