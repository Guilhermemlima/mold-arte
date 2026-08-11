"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const steps = [
  {
    number: "01",
    title: "Você conta a ideia",
    body: "Manda um desenho, uma foto, um arquivo STL ou só descreve o que precisa. Se não tiver modelo 3D, a gente modela.",
  },
  {
    number: "02",
    title: "Orçamento em 24h",
    body: "Analisamos volume, material e acabamento e devolvemos o valor fechado com prazo — sem surpresa depois.",
  },
  {
    number: "03",
    title: "Impressão",
    body: "Fatiamos com o perfil certo para a peça e imprimimos. Você acompanha o andamento pelo WhatsApp.",
  },
  {
    number: "04",
    title: "Acabamento",
    body: "Remoção de suportes, lixamento, colagem e pintura quando o projeto pede. É aqui que a peça vira produto.",
  },
  {
    number: "05",
    title: "Na sua mão",
    body: "Embalagem reforçada, código de rastreio e envio para todo o Brasil.",
  },
];

/**
 * Linha do tempo do processo. No desktop, os cards deslizam horizontalmente
 * enquanto a seção fica presa na tela (pin + scrub do ScrollTrigger).
 * No mobile vira uma lista vertical comum.
 */
export default function Process() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;

    const mm = gsap.matchMedia();

    mm.add(
      {
        desktop: "(min-width: 1024px) and (prefers-reduced-motion: no-preference)",
      },
      () => {
        const distance = track.scrollWidth - window.innerWidth + 120;
        if (distance <= 0) return;

        const tween = gsap.to(track, {
          x: -distance,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: () => `+=${distance}`,
            pin: true,
            scrub: 1,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });

        // Barra de progresso da seção
        gsap.to(".process-progress", {
          scaleX: 1,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: () => `+=${distance}`,
            scrub: true,
          },
        });

        return () => {
          tween.kill();
        };
      },
    );

    return () => mm.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-navy-950 py-20 lg:flex lg:h-screen lg:flex-col lg:justify-center lg:py-0"
    >
      <div className="bg-grid absolute inset-0 opacity-50" aria-hidden />

      <div className="container-x relative">
        <p className="flex items-center gap-3 text-[11px] uppercase tracking-[0.3em] text-cyan-400">
          <span className="h-px w-10 bg-cyan-400" />
          Como funciona
        </p>
        <h2 className="mt-4 max-w-2xl font-display text-4xl font-bold leading-tight text-white sm:text-5xl">
          Cinco passos entre a{" "}
          <span className="text-gradient">ideia e a entrega</span>
        </h2>
      </div>

      {/* Trilho */}
      <div className="relative mt-12 lg:mt-16">
        <div
          ref={trackRef}
          className="flex flex-col gap-5 px-5 lg:w-max lg:flex-row lg:gap-8 lg:px-10"
        >
          {steps.map((step, i) => (
            <article
              key={step.number}
              className="glass border-glow relative shrink-0 rounded-2xl p-7 lg:w-[26rem] lg:p-9"
            >
              <span className="font-display text-6xl font-bold leading-none text-white/8 lg:text-7xl">
                {step.number}
              </span>

              <h3 className="mt-5 font-display text-xl font-bold text-white lg:text-2xl">
                {step.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-silver-400">
                {step.body}
              </p>

              {/* Conector */}
              {i < steps.length - 1 && (
                <span
                  className="absolute -bottom-5 left-1/2 hidden h-5 w-px -translate-x-1/2 bg-gradient-to-b from-cyan-400/60 to-transparent lg:-right-8 lg:bottom-auto lg:left-auto lg:top-1/2 lg:block lg:h-px lg:w-8 lg:translate-x-0 lg:bg-gradient-to-r"
                  aria-hidden
                />
              )}
            </article>
          ))}
        </div>
      </div>

      {/* Progresso (desktop) */}
      <div className="container-x relative mt-10 hidden lg:block">
        <div className="h-px w-full bg-white/8">
          <div className="process-progress h-full origin-left scale-x-0 bg-gradient-to-r from-steel-500 to-cyan-400" />
        </div>
      </div>
    </section>
  );
}
