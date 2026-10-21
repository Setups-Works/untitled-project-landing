import { notFound, redirect } from "next/navigation";
import { settingsHref, tabFromSlug } from "../../../../features/settings/tabs";
import Dashboard from "../../page";

/**
 * /dashboard/settings/<section>. The Settings popup itself is opened by AppNav from the address; this page only decides what
 * sits behind it when the address is opened directly (a refresh or a shared link): the dashboard home.
 */
export default async function Page({ params }: { params: Promise<{ tab?: string[] }> }) {
  const { tab } = await params;
  if (!tab?.length) redirect(settingsHref("profile"));
  if (tab.length > 1 || !tabFromSlug(tab[0])) notFound();
  return Dashboard();
}
