import { notFound } from "next/navigation";
import { Suspense } from "react";
import ClientOnly from "../../../../components/app/ClientOnly";
import MetricDetail from "../../../../features/health/components/MetricDetail";
import { isHealthMetric } from "../../../../features/health/format";

export const metadata = {
  title: "Health — untitled project",
  description: "One health metric, day by day.",
};

export default async function Page({ params }: { params: Promise<{ metric: string }> }) {
  const { metric } = await params;
  if (!isHealthMetric(metric)) notFound();
  return (
    <ClientOnly>
      <Suspense fallback={<div className="p-6 text-xs text-fg-muted">Loading…</div>}>
        <MetricDetail metric={metric} />
      </Suspense>
    </ClientOnly>
  );
}
