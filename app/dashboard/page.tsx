import { currentUser } from "../../lib/supabase/admin";
import ClientOnly from "../../components/app/ClientOnly";
import HomeView from "../../components/app/HomeView";

export default async function Page() {
  const user = await currentUser();
  const name = (user?.user_metadata?.full_name as string | undefined) || (user?.email ?? "there").split("@")[0];
  return (
    <ClientOnly>
      <HomeView name={name} />
    </ClientOnly>
  );
}
