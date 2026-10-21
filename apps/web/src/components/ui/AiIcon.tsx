/** The AI mark: a tall pill of grainy blue-to-coral, cut out of the brand image (public/brand/ai-icon.png). Sized by `className`. */
export default function AiIcon({ className = "h-[20px] w-[10px]" }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- a tiny fixed icon; no responsive sizes to optimise
    <img src="/brand/ai-icon.png" alt="" aria-hidden width={60} height={117} className={`${className} object-contain`} />
  );
}
