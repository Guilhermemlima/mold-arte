"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";

/**
 * Efeito "ímã": o elemento persegue levemente o cursor quando ele chega perto.
 * Só ativa em ponteiro fino (mouse) — em toque não faz sentido.
 */
export default function Magnetic({
  children,
  strength = 0.35,
  className,
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduced) return;

    const moveX = gsap.quickTo(el, "x", { duration: 0.5, ease: "power3.out" });
    const moveY = gsap.quickTo(el, "y", { duration: 0.5, ease: "power3.out" });

    /**
     * O centro é medido ao entrar, não a cada movimento.
     *
     * `getBoundingClientRect` obriga o navegador a recalcular o layout para
     * responder, e isso estava acontecendo a cada evento do mouse — no mesmo
     * instante em que o GSAP animava este elemento. Duas consequências: a
     * página parava para se medir dezenas de vezes por segundo bem enquanto o
     * cursor andava, e a referência usada na conta era a do elemento já
     * deslocado, o que fazia o ímã brigar consigo mesmo.
     *
     * Entrando, o elemento está em repouso — é a hora certa de medir.
     */
    let centroX = 0;
    let centroY = 0;

    const mede = () => {
      const rect = el.getBoundingClientRect();
      centroX = rect.left + rect.width / 2;
      centroY = rect.top + rect.height / 2;
    };

    const onEnter = () => mede();

    const onMove = (event: MouseEvent) => {
      moveX((event.clientX - centroX) * strength);
      moveY((event.clientY - centroY) * strength);
    };

    const onLeave = () => {
      moveX(0);
      moveY(0);
    };

    el.addEventListener("mouseenter", onEnter);
    el.addEventListener("mousemove", onMove, { passive: true });
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mouseenter", onEnter);
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [strength]);

  return (
    <span ref={ref} className={className} style={{ display: "inline-block" }}>
      {children}
    </span>
  );
}
