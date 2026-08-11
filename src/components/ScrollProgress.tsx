"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

/** Fio ciano no topo mostrando quanto da página já foi lido. */
export default function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const setWidth = gsap.quickTo(el, "scaleX", {
      duration: 0.25,
      ease: "power2.out",
    });

    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setWidth(max > 0 ? Math.min(1, window.scrollY / max) : 0);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[95] h-0.5" aria-hidden>
      <div
        ref={ref}
        className="h-full origin-left scale-x-0 bg-gradient-to-r from-steel-500 via-cyan-400 to-cyan-300"
        style={{ boxShadow: "0 0 12px rgba(56,216,245,0.6)" }}
      />
    </div>
  );
}
