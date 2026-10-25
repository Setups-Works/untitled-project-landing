import { Suspense } from "react";
import PlanSwitch from "../../../components/app/PlanSwitch";
import ClientOnly from "../../../components/app/ClientOnly";
import HealthApp from "../../../features/health/components/HealthApp";

export const metadata = {
  title: "Health — untitled project",
  description: "Steps, sleep and heart rate from your phone's health app.",
};

export default function HealthPage() {
  return (
    <>
      <PlanSwitch />
      <ClientOnly>
        <Suspense fallback={<div className="p-6 text-xs text-fg-muted">Loading health...</div>}>
          <HealthApp />
        </Suspense>
      </ClientOnly>
    </>
  );
}
