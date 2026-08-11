"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/** Número que conta do zero até o valor quando entra na tela. */
export default function Counter({
  to,
  duration = 1.8,
}: {
  to: number;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const format = (value: number) =>
      new Intl.NumberFormat("pt-BR").format(Math.round(value));

    if (reduced) {
      el.textContent = format(to);
      return;
    }

    const counter = { value: 0 };
    const ctx = gsap.context(() => {
      gsap.to(counter, {
        value: to,
        duration,
        ease: "power2.out",
        onUpdate: () => {
          el.textContent = format(counter.value);
        },
        scrollTrigger: { trigger: el, start: "top 88%", once: true },
      });
    });

    return () => ctx.revert();
  }, [to, duration]);

  return <span ref={ref}>0</span>;
}
