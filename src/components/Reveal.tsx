"use client";

import { useEffect, useRef, type ElementType, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type RevealProps = {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  /** Direção de entrada. */
  from?: "bottom" | "top" | "left" | "right" | "scale" | "blur";
  delay?: number;
  duration?: number;
  /** Anima os filhos diretos em cascata em vez do container inteiro. */
  stagger?: number;
  /** Ponto de disparo do ScrollTrigger. */
  start?: string;
  once?: boolean;
};

const offsets = {
  bottom: { y: 42, x: 0 },
  top: { y: -42, x: 0 },
  left: { y: 0, x: -48 },
  right: { y: 0, x: 48 },
  scale: { y: 0, x: 0 },
  blur: { y: 20, x: 0 },
};

/**
 * Revelação por scroll. Envolve qualquer bloco e anima na entrada do viewport.
 * Com `stagger`, cada filho direto entra em cascata.
 */
export default function Reveal({
  children,
  as: Tag = "div",
  className,
  from = "bottom",
  delay = 0,
  duration = 0.9,
  stagger,
  start = "top 85%",
  once = true,
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const targets = stagger ? Array.from(el.children) : el;

    if (reduced) {
      gsap.set(targets, { opacity: 1, clearProps: "all" });
      el.removeAttribute("data-reveal");
      return;
    }

    const { x, y } = offsets[from];

    const ctx = gsap.context(() => {
      gsap.set(el, { opacity: 1 });

      gsap.fromTo(
        targets,
        {
          opacity: 0,
          y,
          x,
          scale: from === "scale" ? 0.92 : 1,
          filter: from === "blur" ? "blur(12px)" : "blur(0px)",
        },
        {
          opacity: 1,
          y: 0,
          x: 0,
          scale: 1,
          filter: "blur(0px)",
          duration,
          delay,
          stagger: stagger ?? 0,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start,
            toggleActions: once ? "play none none none" : "play reverse play reverse",
          },
        },
      );
    }, el);

    return () => ctx.revert();
  }, [from, delay, duration, stagger, start, once]);

  return (
    <Tag ref={ref} data-reveal className={className}>
      {children}
    </Tag>
  );
}
