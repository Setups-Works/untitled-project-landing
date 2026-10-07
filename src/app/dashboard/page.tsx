import { currentUser } from "../../server/session";
import ClientOnly from "../../components/app/ClientOnly";
import HomeView from "../../components/app/HomeView";

export default async function Page() {
  const user = await currentUser();
  const name = user?.name || (user?.email ?? "there").split("@")[0];
  return (
    <ClientOnly>
      <HomeView name={name} />
    </ClientOnly>
  );
}
