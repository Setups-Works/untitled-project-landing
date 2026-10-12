"use client";
import Link from "next/link";
import { useAuthState } from "./useAuthState";

/** Site header actions: "Log in" + "Get started" for visitors, a single "Dashboard" button once signed in. */
export default function HeaderAuth() {
  const state = useAuthState();
  if (state === "in")
    return (
      <Link href="/dashboard" className="btn btn-primary btn-sm max-sm:hidden">
        Dashboard
      </Link>
    );
  return (
    <>
      <Link
        href="/login"
        className="liquid-pill inline-flex h-11 items-center rounded-pill px-5 text-[14px] whitespace-nowrap text-fg transition-[transform,box-shadow] duration-300 hover:-translate-y-px active:scale-95 max-sm:hidden"
      >
        Log in
      </Link>
      <Link href="/signup" className="btn btn-primary btn-sm whitespace-nowrap max-sm:hidden">
        Get started
      </Link>
    </>
  );
}
