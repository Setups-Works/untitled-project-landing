import { Redirect, useLocalSearchParams } from "expo-router";

/** Health now lives inside the Plan tab; this keeps `/health` links (chat, widgets, notes) working. */
export default function HealthRedirect() {
  const { d } = useLocalSearchParams<{ d?: string }>();
  return <Redirect href={{ pathname: "/todo", params: d ? { view: "health", d } : { view: "health" } }} />;
}
