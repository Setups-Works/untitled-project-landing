"use client";
import { useRef, type ReactNode } from "react";
import { useMotion } from "./motion";

/** Pulls its content a little toward the pointer when it comes close — for the main calls to action. Fine pointers only. */
export function Magnetic({ children, strength = 0.32, className = "" }: { children: ReactNode; strength?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useMotion(ref, ({ g, root, calm }) => {
    if (calm || !window.matchMedia("(pointer: fine)").matches) return;
    const x = g.quickTo(root, "x", { duration: 0.6, ease: "elastic.out(1, 0.5)" });
    const y = g.quickTo(root, "y", { duration: 0.6, ease: "elastic.out(1, 0.5)" });
    const move = (e: PointerEvent) => {
      const r = root.getBoundingClientRect();
      x((e.clientX - (r.left + r.width / 2)) * strength);
      y((e.clientY - (r.top + r.height / 2)) * strength);
    };
    const leave = () => {
      x(0);
      y(0);
    };
    root.addEventListener("pointermove", move);
    root.addEventListener("pointerleave", leave);
    return () => {
      root.removeEventListener("pointermove", move);
      root.removeEventListener("pointerleave", leave);
    };
  });
  return (
    <span ref={ref} className={`inline-flex ${className}`}>
      {children}
    </span>
  );
}
