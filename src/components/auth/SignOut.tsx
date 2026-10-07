"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "../../lib/auth/client";
import { clearDrafts } from "../../lib/drafts";

export default function SignOut() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      className="btn btn-secondary"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await clearDrafts();
        await authClient.signOut();
        router.push("/");
        router.refresh();
      }}
    >
      Sign out
    </button>
  );
}
