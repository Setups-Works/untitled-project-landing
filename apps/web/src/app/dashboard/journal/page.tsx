import { Suspense } from "react";
import JournalSwitch from "../../../components/app/JournalSwitch";
import ClientOnly from "../../../components/app/ClientOnly";
import JournalView from "../../../components/app/JournalView";

export default function Page() {
  return (
    <ClientOnly>
      <JournalSwitch />
      <Suspense>
        <JournalView />
      </Suspense>
    </ClientOnly>
  );
}
