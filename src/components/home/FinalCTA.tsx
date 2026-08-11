import Link from "next/link";
import Reveal from "@/components/Reveal";
import Magnetic from "@/components/Magnetic";
import { site, whatsappLink } from "@/lib/site";

export default function FinalCTA() {
  return (
    <section className="relative overflow-hidden py-20 lg:py-28">
      <div className="container-x">
        <Reveal
          from="scale"
          className="glass border-glow relative overflow-hidden rounded-3xl px-7 py-14 text-center sm:px-14 lg:py-20"
        >
          <div className="bg-grid absolute inset-0 opacity-50" aria-hidden />
          <div
            className="absolute -top-24 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-cyan-400/15 blur-[100px]"
            aria-hidden
          />

          <div className="relative mx-auto max-w-2xl">
            <p className="flex items-center justify-center gap-3 text-[11px] uppercase tracking-[0.3em] text-cyan-400">
              <span className="h-px w-10 bg-cyan-400" />
              Projeto sob medida
              <span className="h-px w-10 bg-cyan-400" />
            </p>

            <h2 className="mt-6 font-display text-4xl font-bold leading-[1.05] text-white sm:text-5xl lg:text-6xl">
              Tem uma ideia que
              <br />
              <span className="text-gradient">ninguém fabrica?</span>
            </h2>

            <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-silver-400">
              Manda o desenho, a foto ou o arquivo STL. Em até 24 horas você
              recebe o orçamento fechado, com material, prazo e acabamento
              definidos.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Magnetic strength={0.3}>
                <Link
                  href="/orcamento"
                  className="group inline-flex items-center gap-2.5 rounded-full bg-white px-8 py-4 font-semibold text-ink transition-all duration-400 hover:bg-cyan-300 hover:shadow-glow"
                >
                  Pedir orçamento
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-400 group-hover:translate-x-1">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </Link>
              </Magnetic>

              <a
                href={whatsappLink(
                  "Olá! Queria um orçamento de uma peça personalizada.",
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 rounded-full border border-white/15 px-8 py-4 font-semibold text-white transition-colors duration-400 hover:border-cyan-400/50 hover:text-cyan-300"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm5.43 12.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15s-.77.96-.94 1.16c-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.64-2.05-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.69.25-1.28.17-1.41-.07-.13-.27-.2-.57-.35z" />
                </svg>
                Chamar no WhatsApp
              </a>
            </div>

            <p className="mt-7 text-xs text-muted">
              Resposta em até 24h úteis · {site.contact.email}
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
