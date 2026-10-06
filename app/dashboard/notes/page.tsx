import { Suspense } from "react";
import NotesView from "../../../components/app/NotesView";

export default function Page() {
  return (
    <Suspense>
      <NotesView />
    </Suspense>
  );
}
