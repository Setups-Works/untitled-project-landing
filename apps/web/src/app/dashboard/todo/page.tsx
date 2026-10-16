import { Suspense } from "react";
import ClientOnly from "../../../components/app/ClientOnly";
import PlanSwitch from "../../../components/app/PlanSwitch";
import TodoApp from "../../../components/app/todo/TodoApp";

export default function Page() {
  return (
    <ClientOnly>
      <PlanSwitch />
      <Suspense>
        <TodoApp />
      </Suspense>
    </ClientOnly>
  );
}
