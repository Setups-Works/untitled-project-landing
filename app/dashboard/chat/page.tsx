import { Suspense } from "react";
import { currentUser } from "../../../lib/supabase/admin";
import ClientOnly from "../../../components/app/ClientOnly";
import ChatApp from "../../../components/app/chat/ChatApp";

export default async function Page() {
  const user = await currentUser();
  const name = ((user?.user_metadata?.full_name as string | undefined) || (user?.email ?? "there").split("@")[0]).split(" ")[0];
  return (
    <ClientOnly>
      <Suspense>
        <ChatApp name={name} />
      </Suspense>
    </ClientOnly>
  );
}
