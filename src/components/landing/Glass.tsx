"use client";
import { useEffect, useRef, type CSSProperties, type ElementType, type PointerEvent, type ReactNode } from "react";
import gsap from "gsap";
import { toneClass, type Tone } from "../../lib/tones";

const RADIUS = { r2: "rounded-r2", r3: "rounded-r3", r4: "rounded-r4", r5: "rounded-r5", pill: "rounded-pill" } as const;
const SKIN = { panel: "liquid", flat: "liquid-flat", dark: "liquid-dark", pill: "liquid-pill" } as const;

/**
 * A liquid-glass surface. `panel` is the full material (blur + specular rim + sheen), `flat` is the same look without a backdrop
 * blur (use it for cards that sit on a panel), `dark` is the smoked version. With `glare` a soft highlight follows the pointer;
 * `lift` raises the surface on hover; `tone` washes an `at-<tint>` colour into the glass.
 */
export default function Glass({
  as: Tag = "div",
  variant = "panel",
  radius = "r4",
  tone,
  glare = false,
  tilt = false,
  lift = false,
  className = "",
  style,
  children,
  ...rest
}: {
  as?: ElementType;
  variant?: keyof typeof SKIN;
  radius?: keyof typeof RADIUS;
  tone?: Tone;
  glare?: boolean;
  /** Leans a few degrees toward the pointer (3D), springing back when it leaves. Fine pointers only. */
  tilt?: boolean;
  lift?: boolean;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  id?: string;
  role?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "data-emphasis"?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  const lean = useRef<{ x: (v: number) => void; y: (v: number) => void } | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!tilt || !el || !window.matchMedia("(pointer: fine) and (prefers-reduced-motion: no-preference)").matches) return;
    gsap.set(el, { transformPerspective: 900 });
    lean.current = {
      x: gsap.quickTo(el, "rotationX", { duration: 0.7, ease: "power3" }),
      y: gsap.quickTo(el, "rotationY", { duration: 0.7, ease: "power3" }),
    };
    return () => {
      lean.current = null;
      gsap.set(el, { clearProps: "transform" });
    };
  }, [tilt]);
  const move = (e: PointerEvent<HTMLElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
    if (lean.current) {
      lean.current.y(((e.clientX - r.left) / r.width - 0.5) * 9);
      lean.current.x(-((e.clientY - r.top) / r.height - 0.5) * 9);
    }
  };
  const settle = () => {
    ref.current?.style.setProperty("--glare", "0");
    lean.current?.x(0);
    lean.current?.y(0);
  };
  const enter = () => ref.current?.style.setProperty("--glare", "1");
  const tinted = tone && variant !== "dark";
  return (
    <Tag
      ref={ref}
      className={`${SKIN[variant]} ${RADIUS[radius]} ${tinted ? `${toneClass(tone)} liquid-tint` : ""} ${lift ? "liquid-lift" : ""} ${className}`}
      style={style}
      {...(glare || tilt ? { onPointerMove: move, onPointerEnter: enter, onPointerLeave: settle } : {})}
      {...rest}
    >
      {children}
    </Tag>
  );
}
