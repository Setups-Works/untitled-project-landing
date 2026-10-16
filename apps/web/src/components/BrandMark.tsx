/** The ghost mascot that sits before the "untitled project" wordmark. Sized in px so it scales with the wordmark beside it. */
export function BrandMark({ size = 24, className = "" }: { size?: number; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand/ghost.png"
      alt=""
      width={size}
      height={size}
      aria-hidden
      className={`shrink-0 object-contain ${className}`}
    />
  );
}
