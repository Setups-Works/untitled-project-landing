import AsyncStorage from "@react-native-async-storage/async-storage";

// Not secret, only "has this device seen the intro", so plain storage is right (the session lives in SecureStore).
const KEY = "untitled.onboarding.v1";

export async function readOnboardingDone(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(KEY)) === "done";
  } catch {
    return false;
  }
}

export async function writeOnboardingDone(): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, "done");
  } catch {
    // If storage fails the intro simply shows again next launch.
  }
}
