import type { Task } from "@untitled/types";
import { Alert } from "react-native";

import { useTaskActions } from "./queries";
import { errorMessage } from "@/lib/api";
import { isoDate } from "@untitled/logic";

/** Tick or untick a task. Repeating tasks schedule their next occurrence (see useTaskActions.toggle). */
export function useToggleTask() {
  const { toggle } = useTaskActions(isoDate());
  return (t: Task) => toggle.mutate(t, { onError: (e) => Alert.alert("Couldn’t update that task", errorMessage(e)) });
}
