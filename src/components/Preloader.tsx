"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

/**
 * Abertura da página: a barra enche até 100% enquanto o app monta, o lobo
 * pulsa e a cortina sobe. Só aparece na primeira visita da sessão — voltar
 * para a home não repete a animação.
 */
const SESSION_KEY = "moldarte3d.preloaded";

export default function Preloader() {
  const rootRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const pctRef = useRef<HTMLSpanElement>(null);
  const [render, setRender] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const seen = sessionStorage.getItem(SESSION_KEY);

    if (seen || reduced) {
      document.body.style.overflow = "";
      return;
    }

    setRender(true);
    document.body.style.overflow = "hidden";
    sessionStorage.setItem(SESSION_KEY, "1");
  }, []);

  useEffect(() => {
    if (!render) return;
    const root = rootRef.current;
    const bar = barRef.current;
    const pct = pctRef.current;
    if (!root || !bar || !pct) return;

    const counter = { value: 0 };

    const tl = gsap.timeline({
      onComplete: () => {
        document.body.style.overflow = "";
        setRender(false);
      },
    });

    tl.to(counter, {
      value: 100,
      duration: 1.5,
      ease: "power2.inOut",
      onUpdate: () => {
        const v = Math.round(counter.value);
        pct.textContent = `${v}`;
        bar.style.width = `${v}%`;
      },
    })
      .to(".preloader-content", {
        opacity: 0,
        y: -20,
        duration: 0.45,
        ease: "power2.in",
      })
      .to(
        root,
        {
          yPercent: -100,
          duration: 0.9,
          ease: "expo.inOut",
        },
        "-=0.1",
      );

    return () => {
      tl.kill();
      document.body.style.overflow = "";
    };
  }, [render]);

  if (!render) return null;

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[300] flex items-center justify-center bg-ink"
      role="status"
      aria-label="Carregando"
    >
      <div className="bg-grid absolute inset-0 opacity-40" />
      <div
        className="absolute inset-x-0 h-24 bg-gradient-to-b from-transparent via-cyan-400/8 to-transparent animate-scan"
        aria-hidden
      />

      <div className="preloader-content relative flex w-full max-w-xs flex-col items-center px-6">
        {/* Logo real da marca, com um anel girando por fora */}
        <div className="relative h-28 w-28">
          <svg
            viewBox="0 0 200 200"
            className="absolute inset-0 h-full w-full"
            aria-hidden
          >
            <circle
              cx="100"
              cy="100"
              r="94"
              fill="none"
              stroke="#1e4370"
              strokeWidth="3"
            />
            <circle
              cx="100"
              cy="100"
              r="94"
              fill="none"
              stroke="#38d8f5"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="130 460"
            >
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 100 100"
                to="360 100 100"
                dur="1.4s"
                repeatCount="indefinite"
              />
            </circle>
          </svg>

          <Image
            src="/logo.png"
            alt="Moldarte 3D"
            width={158}
            height={159}
            priority
            className="absolute inset-[12%] h-[76%] w-[76%] rounded-full object-cover"
          />
        </div>

        <p className="mt-6 font-display text-sm font-bold tracking-[0.34em] text-white">
          MOLDARTE<span className="text-cyan-400">3D</span>
        </p>

        <div className="mt-6 h-px w-full overflow-hidden bg-white/10">
          <div ref={barRef} className="h-full w-0 bg-cyan-400" />
        </div>

        <p className="mt-3 text-[11px] tracking-[0.2em] text-silver-400">
          <span ref={pctRef}>0</span>% · fatiando camadas
        </p>
      </div>
    </div>
  );
}
