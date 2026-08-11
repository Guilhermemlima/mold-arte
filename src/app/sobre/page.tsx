import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import Reveal from "@/components/Reveal";
import Marquee from "@/components/Marquee";
import Counter from "@/components/Counter";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Sobre",
  description:
    "Quem é a Moldarte 3D: uma oficina de impressão 3D que trata cada peça como projeto, do arquivo ao acabamento.",
};

const values = [
  {
    title: "Peça é projeto, não é print",
    body: "Cada modelo recebe um perfil de fatiamento próprio. Direção de camada, suporte, preenchimento — tudo pensado para a peça aguentar o uso que ela vai ter.",
  },
  {
    title: "Acabamento é metade do trabalho",
    body: "Tirar da impressora é a parte fácil. O que separa uma peça amadora de um produto é lixar, colar e pintar com paciência.",
  },
  {
    title: "Prazo dito é prazo cumprido",
    body: "Preferimos dizer sete dias e entregar em cinco a prometer dois e atrasar. Se algo der errado na impressão, avisamos no mesmo dia.",
  },
  {
    title: "Sem caixa-preta no orçamento",
    body: "Você sabe qual material, quantas horas de máquina e qual acabamento está pagando. Nada de valor redondo sem explicação.",
  },
];

const timeline = [
  {
    year: "2019",
    title: "Uma impressora na garagem",
    body: "Começou como hobby, imprimindo peça de reposição para os outros e miniatura para a mesa de RPG dos amigos.",
  },
  {
    year: "2021",
    title: "Virou negócio",
    body: "A fila de encomendas passou do que uma máquina dava conta. Entraram mais três impressoras e o primeiro espaço próprio.",
  },
  {
    year: "2023",
    title: "Acabamento profissional",
    body: "Montamos a cabine de pintura e a bancada de pós-processamento. É quando a Moldarte deixa de vender peça e passa a vender produto.",
  },
  {
    year: "Hoje",
    title: "12 máquinas e uma loja",
    body: "Atendemos de peça única a lote corporativo, com envio para todo o Brasil e catálogo próprio.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="Sobre nós"
        title="Uma oficina que trata cada peça como projeto"
        description="A Moldarte 3D nasceu de uma impressora na garagem e da teimosia de não entregar peça com cara de peça impressa."
        breadcrumbs={[{ label: "Sobre" }]}
      />

      {/* Manifesto */}
      <section className="container-x pb-20">
        <Reveal className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <div>
            <p className="font-display text-2xl leading-relaxed text-white sm:text-3xl">
              “Impressora 3D todo mundo compra. O que não se compra é saber{" "}
              <span className="text-gradient">
                em que direção deitar a peça
              </span>{" "}
              para ela não quebrar no primeiro uso.”
            </p>
            <p className="mt-8 text-base leading-relaxed text-silver-400">
              É isso que a gente faz aqui. Cada pedido passa por análise técnica
              antes de virar código de máquina: onde a peça vai sofrer esforço,
              qual material aguenta o ambiente dela, quanto de suporte dá para
              evitar para o acabamento sair limpo.
            </p>
            <p className="mt-4 text-base leading-relaxed text-silver-400">
              Depois vem a parte que ninguém mostra no vídeo acelerado: remover
              suporte sem marcar, lixar até a camada sumir, colar as partes de
              peças grandes e pintar. É demorado — e é exatamente por isso que a
              peça chega diferente na sua mão.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/loja"
                className="rounded-full bg-white px-7 py-3.5 font-semibold text-ink transition-all duration-300 hover:bg-cyan-300 hover:shadow-glow"
              >
                Ver o catálogo
              </Link>
              <Link
                href="/orcamento"
                className="rounded-full border border-white/15 px-7 py-3.5 font-semibold text-white transition-colors hover:border-cyan-400/40 hover:text-cyan-300"
              >
                Pedir orçamento
              </Link>
            </div>
          </div>

          {/* Números */}
          <dl className="grid grid-cols-2 gap-4 self-start">
            {[
              { value: 4200, suffix: "+", label: "peças entregues" },
              { value: 12, suffix: "", label: "impressoras" },
              { value: 6, suffix: "", label: "anos de oficina" },
              { value: 98, suffix: "%", label: "aprovação na 1ª amostra" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="glass border-glow rounded-2xl p-6"
              >
                <dt className="font-display text-3xl font-bold text-white sm:text-4xl">
                  <Counter to={stat.value} />
                  <span className="text-cyan-400">{stat.suffix}</span>
                </dt>
                <dd className="mt-1.5 text-[11px] uppercase tracking-wider text-silver-400">
                  {stat.label}
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </section>

      <Marquee
        items={[
          "Análise técnica em todo pedido",
          "Acabamento feito à mão",
          "Prazo cumprido",
          "Orçamento transparente",
          "Envio para todo o Brasil",
        ]}
      />

      {/* Linha do tempo */}
      <section className="container-x py-20 lg:py-28">
        <Reveal>
          <p className="flex items-center gap-3 text-[11px] uppercase tracking-[0.3em] text-cyan-400">
            <span className="h-px w-10 bg-cyan-400" />
            Nossa história
          </p>
          <h2 className="mt-4 max-w-xl font-display text-4xl font-bold leading-tight text-white sm:text-5xl">
            De uma máquina para <span className="text-gradient">doze</span>
          </h2>
        </Reveal>

        <Reveal stagger={0.1} className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {timeline.map((item) => (
            <article
              key={item.year}
              className="glass border-glow relative overflow-hidden rounded-2xl p-6"
            >
              <span className="font-display text-4xl font-bold leading-none text-white/8">
                {item.year}
              </span>
              <h3 className="mt-4 font-display text-lg font-bold text-white">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-silver-400">
                {item.body}
              </p>
            </article>
          ))}
        </Reveal>
      </section>

      {/* Valores */}
      <section className="container-x pb-24">
        <Reveal>
          <p className="flex items-center gap-3 text-[11px] uppercase tracking-[0.3em] text-cyan-400">
            <span className="h-px w-10 bg-cyan-400" />
            Como trabalhamos
          </p>
          <h2 className="mt-4 max-w-xl font-display text-4xl font-bold leading-tight text-white sm:text-5xl">
            Quatro regras que a gente <span className="text-gradient">não quebra</span>
          </h2>
        </Reveal>

        <Reveal stagger={0.09} className="mt-12 grid gap-5 sm:grid-cols-2">
          {values.map((value, i) => (
            <article
              key={value.title}
              className="glass border-glow rounded-2xl p-7"
            >
              <span className="font-display text-xs font-bold text-cyan-400 tabular-nums">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-3 font-display text-xl font-bold text-white">
                {value.title}
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-silver-400">
                {value.body}
              </p>
            </article>
          ))}
        </Reveal>

        <Reveal className="glass border-glow mt-12 rounded-2xl p-8 text-center">
          <p className="text-sm text-silver-400">
            Quer conversar sobre um projeto?
          </p>
          <a
            href={`mailto:${site.contact.email}`}
            className="mt-2 inline-block font-display text-2xl font-bold text-white transition-colors hover:text-cyan-400"
          >
            {site.contact.email}
          </a>
        </Reveal>
      </section>
    </>
  );
}
