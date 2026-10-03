import type { Metadata } from "next";
import { Suspense } from "react";
import AuthShell from "../../components/auth/AuthShell";
import AuthForm from "../../components/auth/AuthForm";

export const metadata: Metadata = { title: "Forgot password — untitled project", robots: { index: false } };

export default function Page() {
  return (
    <AuthShell>
      <Suspense>
        <AuthForm mode="forgot" />
      </Suspense>
    </AuthShell>
  );
}
