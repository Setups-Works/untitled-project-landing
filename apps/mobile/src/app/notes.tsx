import { Redirect } from "expo-router";

/** Notes lives next to To-do in one tab; links to `/notes` (Home, chat, insights) land on its page. */
export default function NotesRoute() {
  return <Redirect href={{ pathname: "/todo", params: { view: "notes" } }} />;
}
