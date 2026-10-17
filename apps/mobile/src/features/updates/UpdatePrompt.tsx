import { useAppUpdate } from "./useAppUpdate";

/** Mounted once at the root so the update dialog can appear over any screen. */
export function UpdatePrompt() {
  return useAppUpdate().dialog;
}
