import { Suspense } from "react";
import ClientOnly from "../../../../components/app/ClientOnly";
import { CollaborationApp } from "../../../../features/collaboration";

export default function Page() {
  return (
    <ClientOnly>
      <Suspense>
        <CollaborationApp />
      </Suspense>
    </ClientOnly>
  );
}
