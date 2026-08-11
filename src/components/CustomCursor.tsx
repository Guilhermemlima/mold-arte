"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

/**
 * Cursor customizado: um ponto ciano que segue o mouse na hora e um anel que
 * vem atrás com atraso. Ao passar por links/botões, o anel cresce.
 * Desativado em toque e quando o usuário pede menos movimento.
 */
export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduced) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    document.documentElement.classList.add("cursor-none-desktop");
    gsap.set([dot, ring], { xPercent: -50, yPercent: -50, opacity: 0 });

    const dotX = gsap.quickTo(dot, "x", { duration: 0.12, ease: "power3.out" });
    const dotY = gsap.quickTo(dot, "y", { duration: 0.12, ease: "power3.out" });
    const ringX = gsap.quickTo(ring, "x", { duration: 0.5, ease: "power3.out" });
    const ringY = gsap.quickTo(ring, "y", { duration: 0.5, ease: "power3.out" });

    let visible = false;
    const onMove = (event: MouseEvent) => {
      if (!visible) {
        visible = true;
        gsap.to([dot, ring], { opacity: 1, duration: 0.3 });
      }
      dotX(event.clientX);
      dotY(event.clientY);
      ringX(event.clientX);
      ringY(event.clientY);
    };

    const interactive = 'a, button, [role="button"], input, select, textarea, label';

    const onOver = (event: MouseEvent) => {
      if ((event.target as HTMLElement).closest(interactive)) {
        gsap.to(ring, { scale: 1.9, borderColor: "rgba(56,216,245,0.9)", duration: 0.35, ease: "power3.out" });
        gsap.to(dot, { scale: 0.4, duration: 0.35 });
      }
    };

    const onOut = (event: MouseEvent) => {
      if ((event.target as HTMLElement).closest(interactive)) {
        gsap.to(ring, { scale: 1, borderColor: "rgba(139,160,184,0.45)", duration: 0.35, ease: "power3.out" });
        gsap.to(dot, { scale: 1, duration: 0.35 });
      }
    };

    const onLeaveWindow = () => {
      visible = false;
      gsap.to([dot, ring], { opacity: 0, duration: 0.25 });
    };

    window.addEventListener("mousemove", onMove);
    document.addEventListener("mouseover", onOver);
    document.addEventListener("mouseout", onOut);
    document.addEventListener("mouseleave", onLeaveWindow);

    return () => {
      document.documentElement.classList.remove("cursor-none-desktop");
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseout", onOut);
      document.removeEventListener("mouseleave", onLeaveWindow);
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[200] hidden md:block">
      <div
        ref={ringRef}
        className="fixed left-0 top-0 h-8 w-8 rounded-full border"
        style={{ borderColor: "rgba(139,160,184,0.45)" }}
      />
      <div
        ref={dotRef}
        className="fixed left-0 top-0 h-1.5 w-1.5 rounded-full bg-cyan-400"
        style={{ boxShadow: "0 0 12px rgba(56,216,245,0.9)" }}
      />
    </div>
  );
}
