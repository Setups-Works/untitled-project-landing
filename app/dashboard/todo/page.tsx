import { Suspense } from "react";
import ClientOnly from "../../../components/app/ClientOnly";
import TodoApp from "../../../components/app/todo/TodoApp";

export default function Page() {
  return (
    <ClientOnly>
      <Suspense>
        <TodoApp />
      </Suspense>
    </ClientOnly>
  );
}
