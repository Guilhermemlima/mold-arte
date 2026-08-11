import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import QuoteForm from "@/components/orcamento/QuoteForm";
import Reveal from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Orçamento sob medida",
  description:
    "Envie seu arquivo STL, desenho ou ideia e receba um orçamento fechado de impressão 3D em até 24 horas.",
};

const faq = [
  {
    q: "Não tenho arquivo 3D. Dá para fazer?",
    a: "Dá. Modelamos a partir de fotos, desenho à mão, medidas ou até da peça física. A modelagem entra no orçamento e você aprova a prévia antes de imprimirmos.",
  },
  {
    q: "Quais formatos vocês aceitam?",
    a: "STL, OBJ, 3MF e STEP para modelos prontos. Para referência visual, qualquer imagem ou PDF resolve.",
  },
  {
    q: "Qual o tamanho máximo da peça?",
    a: "Até 30 × 30 × 40 cm em uma peça única. Acima disso, dividimos em partes e colamos — a emenda fica praticamente invisível depois do acabamento.",
  },
  {
    q: "Vocês fazem lote grande?",
    a: "Sim. Temos 12 impressoras rodando e o preço por unidade cai bastante a partir de 50 peças. Conte no formulário quantas você precisa.",
  },
];

export default function QuotePage() {
  return (
    <>
      <PageHeader
        eyebrow="Projeto sob medida"
        title="Manda a ideia. A gente materializa."
        description="Preencha o formulário com o máximo de detalhe que der. Em até 24 horas úteis você recebe o orçamento fechado — material, prazo, acabamento e valor."
        breadcrumbs={[{ label: "Orçamento" }]}
      />

      <div className="container-x grid gap-12 pb-24 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
        <QuoteForm />

        <div className="space-y-10">
          {/* Como funciona */}
          <Reveal from="right" className="glass border-glow rounded-2xl p-7">
            <h2 className="font-display text-lg font-bold text-white">
              O que acontece depois
            </h2>
            <ol className="mt-5 space-y-5">
              {[
                {
                  title: "Análise técnica",
                  body: "Conferimos se o modelo é imprimível e onde precisa de reforço ou suporte.",
                },
                {
                  title: "Orçamento fechado",
                  body: "Você recebe valor, prazo e material por WhatsApp e e-mail. Sem taxa escondida.",
                },
                {
                  title: "Prévia para aprovar",
                  body: "Em peças modeladas do zero, mandamos o render antes de imprimir.",
                },
                {
                  title: "Produção e envio",
                  body: "Aprovado, entra na fila de impressão. Você acompanha até a postagem.",
                },
              ].map((item, i) => (
                <li key={item.title} className="flex gap-4">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-cyan-400/30 font-display text-xs font-bold text-cyan-400">
                    {i + 1}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-white">
                      {item.title}
                    </span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-silver-400">
                      {item.body}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          </Reveal>

          {/* Perguntas frequentes */}
          <Reveal from="right">
            <h2 className="font-display text-lg font-bold text-white">
              Perguntas frequentes
            </h2>
            <div className="mt-5 space-y-3">
              {faq.map((item) => (
                <details
                  key={item.q}
                  className="glass group rounded-xl px-5 py-4 transition-colors [&[open]]:border-cyan-400/25"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-white">
                    {item.q}
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      className="shrink-0 text-cyan-400 transition-transform duration-300 group-open:rotate-45"
                    >
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-silver-400">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </>
  );
}
