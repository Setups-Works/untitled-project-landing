import Link from "next/link";
import AuthLink from "../auth/AuthLink";
import { BrandMark } from "../BrandMark";

/**
 * The only chrome on a public share page: the app's name and one button. The marketing header and footer are hidden here (see
 * HideInApp), so someone opening a shared link sees the content, not a landing page.
 */
export default function ShareHeader() {
  return (
    <header className="mx-auto flex w-full max-w-[820px] items-center justify-between gap-3 px-[clamp(16px,4vw,24px)] pt-5">
      <Link href="/" className="flex items-center gap-2 font-serif text-[22px] tracking-[-0.02em]">
        <BrandMark size={26} />
        untitled project
      </Link>
      <AuthLink className="btn btn-secondary btn-sm" />
    </header>
  );
}
