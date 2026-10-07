"use client";
import Link from "next/link";
import { useAuthState } from "./useAuthState";

/** Site header actions: "Log in" + "Get started" for visitors, a single "Dashboard" button once signed in. */
export default function HeaderAuth() {
  const state = useAuthState();
  if (state === "in")
    return (
      <Link href="/dashboard" className="btn btn-primary btn-sm hide-sm hd-cta">
        Dashboard
      </Link>
    );
  return (
    <>
      <Link href="/login" className="nav-login hide-sm">
        Log in
      </Link>
      <Link href="/signup" className="btn btn-primary btn-sm hide-sm hd-cta">
        Get started
      </Link>
    </>
  );
}
