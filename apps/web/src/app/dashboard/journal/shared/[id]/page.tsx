import { Suspense } from "react";
import JournalSwitch from "../../../../../components/app/JournalSwitch";
import ClientOnly from "../../../../../components/app/ClientOnly";
import { SharedJournalApp } from "../../../../../features/collaboration";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <ClientOnly>
      <JournalSwitch />
      <Suspense>
        <SharedJournalApp id={id} />
      </Suspense>
    </ClientOnly>
  );
}
