import { Suspense } from "react";
import JournalSwitch from "../../../../components/app/JournalSwitch";
import ClientOnly from "../../../../components/app/ClientOnly";
import { CollaborationApp } from "../../../../features/collaboration";

export default function Page() {
  return (
    <ClientOnly>
      <JournalSwitch />
      <Suspense>
        <CollaborationApp />
      </Suspense>
    </ClientOnly>
  );
}
