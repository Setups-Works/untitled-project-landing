import { Suspense } from "react";
import ClientOnly from "../../../components/app/ClientOnly";
import JournalView from "../../../components/app/JournalView";

export default function Page() {
  return (
    <ClientOnly>
      <Suspense>
        <JournalView />
      </Suspense>
    </ClientOnly>
  );
}
