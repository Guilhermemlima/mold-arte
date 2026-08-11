"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Magnetic from "@/components/Magnetic";

gsap.registerPlugin(ScrollTrigger);

/** Quebra o texto em spans por palavra para animar uma a uma. */
function SplitWords({ text, className }: { text: string; className?: string }) {
  return (
    <span className={className}>
      {text.split(" ").map((word, i) => (
        <span key={i} className="inline-block overflow-hidden align-bottom">
          <span className="hero-word inline-block pb-[0.12em]">
            {word}
            {i < text.split(" ").length - 1 && " "}
          </span>
        </span>
      ))}
    </span>
  );
}

export default function Hero() {
  const rootRef = useRef<HTMLElement>(null);
  const wolfRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context(() => {
      if (reduced) {
        gsap.set(".hero-word, .hero-fade, .hero-visual", { opacity: 1, y: 0 });
        return;
      }

      // Entrada
      const tl = gsap.timeline({ delay: 0.15 });

      tl.from(".hero-eyebrow", {
        opacity: 0,
        y: 14,
        duration: 0.7,
        ease: "power3.out",
      })
        .from(
          ".hero-word",
          {
            yPercent: 118,
            duration: 1.05,
            ease: "expo.out",
            stagger: 0.035,
          },
          "-=0.35",
        )
        .from(
          ".hero-fade",
          {
            opacity: 0,
            y: 22,
            duration: 0.85,
            ease: "power3.out",
            stagger: 0.09,
          },
          "-=0.65",
        )
        .from(
          ".hero-visual",
          {
            opacity: 0,
            scale: 0.86,
            rotate: -6,
            duration: 1.3,
            ease: "expo.out",
          },
          "-=1.1",
        )
        .from(
          ".hero-stat",
          {
            opacity: 0,
            y: 18,
            duration: 0.7,
            ease: "power3.out",
            stagger: 0.08,
          },
          "-=0.8",
        );

      // Parallax do conteúdo ao rolar
      gsap.to(".hero-copy", {
        y: -70,
        opacity: 0.35,
        ease: "none",
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });

      gsap.to(".hero-visual", {
        y: 90,
        rotate: 8,
        ease: "none",
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });

      // O lobo acompanha levemente o mouse
      const wolf = wolfRef.current;
      if (wolf && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
        const rotY = gsap.quickTo(wolf, "rotationY", { duration: 0.9, ease: "power3.out" });
        const rotX = gsap.quickTo(wolf, "rotationX", { duration: 0.9, ease: "power3.out" });
        const onMove = (e: MouseEvent) => {
          const px = e.clientX / window.innerWidth - 0.5;
          const py = e.clientY / window.innerHeight - 0.5;
          rotY(px * 22);
          rotX(-py * 16);
        };
        window.addEventListener("mousemove", onMove);
        return () => window.removeEventListener("mousemove", onMove);
      }
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={rootRef}
      className="relative overflow-hidden pb-20 pt-16 sm:pt-20 lg:pb-28 lg:pt-24"
    >
      {/* Fundo */}
      <div className="bg-grid absolute inset-0 opacity-60" aria-hidden />
      <div
        className="absolute -left-40 top-0 h-[36rem] w-[36rem] rounded-full bg-steel-600/25 blur-[130px]"
        aria-hidden
      />
      <div
        className="absolute -right-32 top-40 h-[32rem] w-[32rem] rounded-full bg-cyan-400/10 blur-[130px]"
        aria-hidden
      />
      <div
        className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-ink to-transparent"
        aria-hidden
      />

      <div className="container-x relative grid items-center gap-14 lg:grid-cols-[1.05fr_1fr] lg:gap-8">
        {/* Texto */}
        <div className="hero-copy">
          <p className="hero-eyebrow flex items-center gap-3 text-[11px] uppercase tracking-[0.3em] text-cyan-400">
            <span className="h-px w-10 bg-cyan-400" />
            Impressão 3D sob demanda
          </p>

          <h1 className="mt-6 font-display text-[clamp(2.6rem,7vw,4.9rem)] font-bold leading-[0.95] text-white">
            <SplitWords text="Da ideia" />
            <br />
            <SplitWords text="à peça pronta" className="text-gradient" />
            <br />
            <SplitWords text="na sua mão." />
          </h1>

          <p className="hero-fade mt-7 max-w-lg text-base leading-relaxed text-silver-400 sm:text-lg">
            Modelamos, imprimimos e damos acabamento em peças que você não acha
            em prateleira. Decoração, colecionáveis, peças técnicas e projetos
            totalmente sob medida.
          </p>

          <div className="hero-fade mt-9 flex flex-wrap items-center gap-3">
            <Magnetic strength={0.3}>
              <Link
                href="/loja"
                className="group inline-flex items-center gap-2.5 rounded-full bg-white px-7 py-4 font-semibold text-ink transition-all duration-400 hover:bg-cyan-300 hover:shadow-glow"
              >
                Explorar a loja
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-transform duration-400 group-hover:translate-x-1"
                >
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </Link>
            </Magnetic>

            <Magnetic strength={0.25}>
              <Link
                href="/orcamento"
                className="glass border-glow inline-flex items-center gap-2.5 rounded-full px-7 py-4 font-semibold text-white transition-colors duration-400 hover:text-cyan-300"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 16V4M8 8l4-4 4 4" />
                  <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
                </svg>
                Enviar meu arquivo
              </Link>
            </Magnetic>
          </div>

          {/* Indicadores */}
          <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-white/8 pt-7">
            {[
              { value: "PLA · PETG", label: "e resina de alta definição" },
              { value: "0,12 mm", label: "camada no acabamento fino" },
              { value: "Brasil", label: "envio para todo o país" },
            ].map((stat) => (
              <div key={stat.label} className="hero-stat">
                <dt className="font-display text-2xl font-bold text-white sm:text-3xl">
                  {stat.value}
                </dt>
                <dd className="mt-1 text-[11px] leading-snug text-silver-400">
                  {stat.label}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Visual */}
        <div className="hero-visual relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="relative aspect-square">
            {/* Anéis orbitando */}
            <div
              className="absolute inset-0 animate-[spin_34s_linear_infinite] rounded-full border border-white/8"
              aria-hidden
            />
            <div
              className="absolute inset-8 animate-[spin_22s_linear_infinite_reverse] rounded-full border border-dashed border-cyan-400/20"
              aria-hidden
            />
            <div
              className="absolute inset-1/4 rounded-full bg-steel-600/20 blur-3xl"
              aria-hidden
            />

            {/* Logo da marca — flutua, inclina acompanhando o mouse e faz
                parallax na rolagem (as animações vivem no useEffect acima) */}
            {/* Duas camadas de propósito: a de fora flutua via CSS, a de dentro
                é do GSAP (inclinação com o mouse). Se as duas mexessem no
                mesmo `transform`, a animação CSS venceria e a inclinação
                simplesmente não apareceria. */}
            <div className="animate-float-slow absolute inset-[19%] h-[62%] w-[62%]">
              <div
                ref={wolfRef}
                className="relative h-full w-full"
                style={{ transformStyle: "preserve-3d" }}
              >
                {/* Brilho por trás */}
                <div
                  className="absolute -inset-6 rounded-full bg-cyan-400/20 blur-3xl"
                  aria-hidden
                />

                {/* Sem moldura: o fundo do emblema é praticamente a mesma cor
                    do site, então ele se funde e o lobo parece flutuar solto. */}
                <div className="relative h-full w-full overflow-hidden rounded-[22%] shadow-[0_40px_90px_-30px_rgba(0,0,0,0.95)]">
                  <Image
                    src="/logo.png"
                    alt="Moldarte 3D"
                    fill
                    sizes="(max-width: 1024px) 60vw, 26rem"
                    priority
                    className="object-cover"
                  />

                  {/* Camadas de impressão passando por cima da arte */}
                  <div className="bg-layers absolute inset-0 opacity-50" aria-hidden />

                  {/* Reflexo que atravessa devagar */}
                  <div
                    className="animate-sheen absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/12 to-transparent"
                    aria-hidden
                  />
                </div>
              </div>
            </div>

            {/* Cartões flutuantes */}
            <div className="glass border-glow absolute -left-2 top-8 rounded-xl px-3.5 py-2.5 sm:left-0">
              <p className="text-[10px] uppercase tracking-wider text-muted">
                Camada
              </p>
              <p className="font-display text-sm font-bold text-white">0,12 mm</p>
            </div>

            <div className="glass border-glow absolute -right-2 top-1/3 rounded-xl px-3.5 py-2.5 sm:right-0">
              <p className="text-[10px] uppercase tracking-wider text-muted">
                Materiais
              </p>
              <p className="font-display text-sm font-bold text-white">
                PLA · PETG · Resina
              </p>
            </div>

            <div className="glass border-glow absolute bottom-6 left-1/2 -translate-x-1/2 rounded-xl px-3.5 py-2.5">
              <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />
                Impressora
              </p>
              <p className="font-display text-sm font-bold text-white">
                Produzindo agora
              </p>
            </div>
          </div>
        </div>
      </div>

    </section>
  );
}
