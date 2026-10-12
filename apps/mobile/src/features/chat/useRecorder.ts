import { AudioModule, RecordingPresets, setAudioModeAsync, useAudioRecorder, useAudioRecorderState } from "expo-audio";
import { useState } from "react";

import type { PendingFile } from "./files";

/** Records a voice note and hands it back as a file to attach (the web does the same with its RecordButton). */
export function useRecorder(onDone: (file: PendingFile) => void, onError: (message: string) => void) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const state = useAudioRecorderState(recorder, 500);
  const [busy, setBusy] = useState(false);

  async function start() {
    const perm = await AudioModule.requestRecordingPermissionsAsync();
    if (!perm.granted) return onError("Allow the microphone to record a voice note.");
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
  }

  async function stop() {
    const secs = Math.max(1, Math.round((state.durationMillis ?? 0) / 1000));
    await recorder.stop();
    await setAudioModeAsync({ allowsRecording: false });
    const uri = recorder.uri;
    if (!uri) return onError("That recording didn’t save. Try again.");
    onDone({ uri, name: `voice-note-${secs}s.m4a`, type: "audio/mp4", size: 0 });
  }

  async function toggle() {
    if (busy) return;
    setBusy(true);
    try {
      if (state.isRecording) await stop();
      else await start();
    } catch {
      onError("Couldn’t use the microphone.");
    } finally {
      setBusy(false);
    }
  }

  return { recording: state.isRecording, secs: Math.round((state.durationMillis ?? 0) / 1000), toggle };
}
