import Image from "next/image";
import type { ReactNode } from "react";

/** The transparent display opening of iphone-frame.png, as a share of the frame (same bounds the marketing renders use). */
const SCREEN = "top-[4.29%] left-[8.46%] h-[91.32%] w-[83.02%] rounded-[12%/5.5%]";

/**
 * An iPhone showing an app screen, tucked into a panel's bottom edge so only its top half shows. Position it with `className`;
 * the panel must clip (`overflow-hidden`). Static on purpose: no motion. The screen is a screenshot (`src`) or, for a feature
 * without one, a drawn screen passed as `children` (sized in container units so it scales with the phone).
 */
export default function PhoneHalf({
  src,
  alt,
  className = "",
  children,
}: {
  src?: string;
  alt: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div className={`pointer-events-none absolute z-30 ${className}`}>
      <div className="translate-y-[48%]">
        <div className="relative aspect-[1419/2796] w-full">
          <div className={`absolute overflow-hidden bg-surface shadow-e3 ${SCREEN}`}>
            {src ? <Image src={src} alt={alt} fill sizes="400px" className="object-cover object-top" /> : <div role="img" aria-label={alt} className="size-full">{children}</div>}
          </div>
          <Image src="/mobile/iphone-frame.png" alt="" width={710} height={1400} aria-hidden className="absolute inset-0 size-full" />
        </div>
      </div>
    </div>
  );
}
