import { notFound } from "next/navigation";
import { Suspense } from "react";
import ClientOnly from "../../../../components/app/ClientOnly";
import WorkspaceSwitch from "../../../../components/app/WorkspaceSwitch";
import { FEATURES } from "../../../../config/features";
import ReaderApp from "../../../../features/rss/components/ReaderApp";

export const metadata = {
  title: "Reader — untitled project",
  description: "Follow feeds and read articles in one place.",
};

export default function ReaderPage() {
  if (!FEATURES.rssReader) notFound();
  return (
    <>
      <WorkspaceSwitch />
      <ClientOnly>
        <Suspense fallback={<div className="p-6 text-xs text-fg-muted">Loading reader...</div>}>
          <ReaderApp />
        </Suspense>
      </ClientOnly>
    </>
  );
}
