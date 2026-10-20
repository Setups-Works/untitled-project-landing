import { Suspense } from "react";
import ClientOnly from "../../../../../components/app/ClientOnly";
import { SharedJournalApp } from "../../../../../features/collaboration";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <ClientOnly>
      <Suspense>
        <SharedJournalApp id={id} />
      </Suspense>
    </ClientOnly>
  );
}
