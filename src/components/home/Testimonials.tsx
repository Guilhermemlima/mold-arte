"use client";

import { useEffect, useState } from "react";
import Reveal from "@/components/Reveal";
import Stars from "@/components/Stars";

const testimonials = [
  {
    name: "Rafael Menezes",
    role: "Arquiteto",
    rating: 5,
    text: "Precisava de uma maquete em três dias e não acreditei que sairia. Saiu no prazo, com nível de detalhe melhor do que eu esperava. Cliente fechou o projeto na hora.",
  },
  {
    name: "Camila Duarte",
    role: "Loja de presentes",
    rating: 5,
    text: "Compro em lote todo mês para revender. Acabamento sempre igual, embalagem impecável e nunca tive uma peça quebrada na viagem.",
  },
  {
    name: "Diego Farias",
    role: "Colecionador",
    rating: 5,
    text: "O dragão articulado é surreal. Chegou montado, cada elo se mexe direitinho, e a pintura em gradiente ficou muito acima do que a foto mostrava.",
  },
  {
    name: "Priscila Lopes",
    role: "Engenheira de produção",
    rating: 4.8,
    text: "Mandei a peça quebrada de um equipamento parado há meses. Modelaram a partir dela e a reposição encaixou de primeira. Salvou a linha.",
  },
  {
    name: "Anderson Reis",
    role: "Setup gamer",
    rating: 5,
    text: "O suporte de headset é pesado de verdade, não tomba. E o azul Moldarte combinou exatamente com o resto da mesa.",
  },
];

export default function Testimonials() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  // Avança sozinho, e para quando o mouse está em cima.
  useEffect(() => {
    if (paused) return;
    const timer = setInterval(
      () => setIndex((i) => (i + 1) % testimonials.length),
      6000,
    );
    return () => clearInterval(timer);
  }, [paused]);

  const active = testimonials[index];

  return (
    <section className="relative overflow-hidden py-20 lg:py-28">
      <div
        className="absolute left-1/2 top-0 h-[26rem] w-[42rem] -translate-x-1/2 rounded-full bg-steel-600/15 blur-[130px]"
        aria-hidden
      />

      <div className="container-x relative">
        <Reveal className="text-center">
          <p className="flex items-center justify-center gap-3 text-[11px] uppercase tracking-[0.3em] text-cyan-400">
            <span className="h-px w-10 bg-cyan-400" />
            Quem já recebeu
            <span className="h-px w-10 bg-cyan-400" />
          </p>
          <h2 className="mx-auto mt-4 max-w-2xl font-display text-4xl font-bold leading-tight text-white sm:text-5xl">
            Nota <span className="text-gradient">4,9</span> em mais de{" "}
            <span className="text-gradient">2.800</span> avaliações
          </h2>
        </Reveal>

        <Reveal
          from="scale"
          className="mx-auto mt-12 max-w-3xl"
        >
          <div
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            className="glass border-glow relative rounded-3xl p-8 sm:p-12"
          >
            <svg
              className="absolute left-8 top-7 h-10 w-10 text-cyan-400/15"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden
            >
              <path d="M9.5 5C6.5 6.7 5 9.4 5 13v6h6v-6H8c0-2.2.8-3.8 2.5-4.8zm9 0C15.5 6.7 14 9.4 14 13v6h6v-6h-3c0-2.2.8-3.8 2.5-4.8z" />
            </svg>

            <div key={index} className="relative animate-[fadeIn_0.6s_ease]">
              <Stars rating={active.rating} size={15} />
              <blockquote className="mt-5 font-display text-xl leading-relaxed text-white sm:text-2xl">
                “{active.text}”
              </blockquote>
              <footer className="mt-7 flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-steel-500 to-navy-800 font-display text-sm font-bold text-white">
                  {active.name
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")}
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{active.name}</p>
                  <p className="text-xs text-silver-400">{active.role}</p>
                </div>
              </footer>
            </div>
          </div>

          {/* Controles */}
          <div className="mt-7 flex items-center justify-center gap-2">
            {testimonials.map((testimonial, i) => (
              <button
                key={testimonial.name}
                onClick={() => setIndex(i)}
                aria-label={`Ver avaliação de ${testimonial.name}`}
                aria-current={i === index}
                className={`h-1.5 rounded-full transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  i === index
                    ? "w-8 bg-cyan-400"
                    : "w-1.5 bg-white/20 hover:bg-white/40"
                }`}
              />
            ))}
          </div>
        </Reveal>
      </div>

      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: none } }`}</style>
    </section>
  );
}
