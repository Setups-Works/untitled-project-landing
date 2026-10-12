"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Cursor from "./Cursor";
import ScrollProgress from "./ScrollProgress";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { initGsap } from "./motion";

/** Site-wide motion: the cursor, the reading-progress line, and keeping ScrollTrigger measurements right after fonts and routes settle. */
export default function MotionRoot() {
  const path = usePathname();
  useEffect(() => {
    initGsap();
    const refresh = () => ScrollTrigger.refresh();
    const t = setTimeout(refresh, 400);
    void document.fonts?.ready.then(refresh);
    window.addEventListener("load", refresh);
    return () => {
      clearTimeout(t);
      window.removeEventListener("load", refresh);
    };
  }, [path]);
  return (
    <>
      <ScrollProgress />
      <Cursor />
    </>
  );
}
