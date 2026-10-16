import { Suspense } from "react";
import PlanSwitch from "../../../components/app/PlanSwitch";
import NotesView from "../../../components/app/NotesView";

export default function Page() {
  return (
    <>
      <PlanSwitch />
      <Suspense>
        <NotesView />
      </Suspense>
    </>
  );
}
