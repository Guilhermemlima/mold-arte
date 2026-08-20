import Image from "next/image";
import Reveal from "@/components/Reveal";
import Stars from "@/components/Stars";
import type { Avaliacao } from "@/lib/avaliacoes";

/**
 * As avaliações de quem comprou.
 *
 * Desenhada no servidor, não no navegador: é conteúdo que o Google precisa
 * enxergar, e é o tipo de coisa que a pessoa lê antes de decidir — não pode
 * depender de um JavaScript que ainda está carregando.
 *
 * Quando não há avaliação nenhuma, a seção some. Um "seja o primeiro a
 * avaliar" só serviria para anunciar que ninguém comprou ainda.
 */
export default function Avaliacoes({
  lista,
  resumo,
}: {
  lista: Avaliacao[];
  resumo: { nota: number; quantas: number } | null;
}) {
  if (!lista.length || !resumo) return null;

  // A âncora "avaliacoes" existe para o "12 avaliações" lá em cima levar
  // direto até aqui, em vez de a pessoa ter que caçar rolando a página.
  return (
    <section id="avaliacoes" className="container-x scroll-mt-28 pb-8">
      <Reveal>
        <div className="glass border-glow rounded-3xl p-7 sm:p-10">
          <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2 border-b border-white/8 pb-6">
            <h2 className="font-display text-2xl font-bold text-white">
              Quem comprou
            </h2>
            <div className="flex items-center gap-2.5">
              <Stars rating={resumo.nota} size={15} />
              <span className="font-display text-sm font-semibold text-white tabular-nums">
                {resumo.nota.toFixed(1).replace(".", ",")}
              </span>
              <span className="text-xs text-silver-400">
                {resumo.quantas}{" "}
                {resumo.quantas === 1 ? "avaliação" : "avaliações"}
              </span>
            </div>
          </div>

          <ul className="mt-7 space-y-7">
            {lista.map((a, i) => (
              <li
                key={`${a.nome}-${a.criado_em}-${i}`}
                className="border-b border-white/6 pb-7 last:border-0 last:pb-0"
              >
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <Stars rating={a.nota} size={13} />
                  <span className="font-display text-sm font-semibold text-white">
                    {a.nome}
                  </span>
                  {/* Marca de compra confirmada: só quem comprou chega aqui,
                      porque a avaliação exige a chave do pedido. */}
                  <span className="inline-flex items-center gap-1 rounded-full border border-cyan-400/25 px-2.5 py-0.5 text-[10px] font-medium text-cyan-400">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="m5 13 4 4L19 7" />
                    </svg>
                    Compra confirmada
                  </span>
                  <time
                    dateTime={a.criado_em}
                    className="ml-auto text-[11px] text-muted tabular-nums"
                  >
                    {new Date(a.criado_em).toLocaleDateString("pt-BR")}
                  </time>
                </div>

                {a.comentario && (
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-silver-200">
                    {a.comentario}
                  </p>
                )}

                {/* Foto de quem comprou vale mais que qualquer foto nossa:
                    mostra a peça na casa de alguém, na luz de verdade. */}
                {a.fotos && a.fotos.length > 0 && (
                  <ul className="mt-3.5 flex flex-wrap gap-2.5">
                    {a.fotos.map((f, j) => (
                      <li key={f.url}>
                        <a
                          href={f.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block overflow-hidden rounded-xl border border-white/12 transition-colors hover:border-cyan-400/50"
                        >
                          <Image
                            src={f.url}
                            alt={`Foto de ${a.nome} — ${j + 1}`}
                            width={112}
                            height={112}
                            sizes="112px"
                            className="h-28 w-28 object-cover"
                          />
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>
      </Reveal>
    </section>
  );
}
