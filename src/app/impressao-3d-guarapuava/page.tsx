import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import Reveal from "@/components/Reveal";
import { site, siteUrl, whatsappLink } from "@/lib/site";

/**
 * Página de busca local.
 *
 * Quem digita "impressão 3D Guarapuava" no Google tem uma pergunta que o
 * restante do site não responde: existe alguém aqui perto que faz isso, e dá
 * para resolver sem depender de encomenda de outro estado? A home responde
 * "peças sob medida para todo o Brasil", que é verdade e não é o que essa
 * pessoa quer ler.
 *
 * Por isso a página existe separada, e por isso ela não repete a home com
 * "Guarapuava" salpicado no meio: o que ela tem de próprio é a retirada em
 * mãos, a conversa presencial sobre a peça e o fato de não haver frete nem
 * espera de transportadora. Página de cidade que só troca o nome da cidade é
 * exatamente o tipo de coisa que o Google aprendeu a ignorar.
 */

const TITULO = `Impressão 3D em ${site.empresa.cidade} — ${site.empresa.uf}`;

export const metadata: Metadata = {
  title: `Impressão 3D em ${site.empresa.cidade}`,
  description:
    `Serviço de impressão e modelagem 3D em ${site.empresa.cidade}, ${site.empresa.uf}. ` +
    "Peças sob medida, protótipos, peças de reposição, decoração e brindes, " +
    "com retirada em mãos na cidade ou envio para todo o Brasil.",
  alternates: { canonical: "/impressao-3d-guarapuava" },
};

const oQueFazemos = [
  {
    titulo: "Peça de reposição",
    corpo:
      "Aquela engrenagem, botão ou suporte que quebrou e não se acha mais para " +
      "comprar. Traga a peça quebrada ou mande uma foto com uma régua ao lado — " +
      "modelamos e imprimimos a nova.",
  },
  {
    titulo: "Protótipo",
    corpo:
      "Antes de mandar fazer molde ou usinagem, dá para segurar a peça na mão " +
      "por uma fração do custo. Ajusta, imprime de novo, ajusta outra vez.",
  },
  {
    titulo: "Peça técnica",
    corpo:
      "Suportes, encaixes, gabaritos, adaptadores e componentes que não existem " +
      "prontos. Em PLA para uso interno, PETG quando pega sol, impacto ou umidade.",
  },
  {
    titulo: "Decoração e presente",
    corpo:
      "Luminárias, vasos, peças de estante e presentes que ninguém mais vai ter " +
      "igual. Dá para escolher cor e tamanho.",
  },
  {
    titulo: "Brinde de empresa",
    corpo:
      `Chaveiro, ímã, troféu e lembrancinha com a marca da empresa, a partir de ` +
      `${site.brindes.minimo} peças. Sem custo de molde, o que torna lote pequeno viável.`,
  },
  {
    titulo: "Modelagem do zero",
    corpo:
      "Não precisa ter arquivo 3D. A gente modela a partir de foto, desenho à " +
      "mão, medida anotada no papel ou da peça física.",
  },
];

export default function GuarapuavaPage() {
  return (
    <>
      {/* Schema da página: diz ao Google que este serviço é prestado nesta
          cidade, que é a pergunta que a busca local faz. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            serviceType: "Impressão 3D e modelagem 3D",
            provider: {
              "@type": "LocalBusiness",
              name: site.name,
              url: siteUrl,
              telephone: `+${site.contact.whatsapp}`,
              address: {
                "@type": "PostalAddress",
                addressLocality: site.empresa.cidade,
                addressRegion: site.empresa.uf,
                addressCountry: "BR",
              },
            },
            areaServed: [
              { "@type": "City", name: site.empresa.cidade },
              { "@type": "Country", name: "Brasil" },
            ],
            url: `${siteUrl}/impressao-3d-guarapuava`,
          }),
        }}
      />

      <PageHeader
        eyebrow={`${site.empresa.cidade} · ${site.empresa.uf}`}
        title={TITULO}
        description={`A Moldarte 3D imprime e modela peças em ${site.empresa.cidade}, no Paraná. Peça de reposição, protótipo, peça técnica, decoração ou brinde de empresa — com retirada em mãos aqui na cidade ou envio para todo o Brasil.`}
        breadcrumbs={[{ label: `Impressão 3D em ${site.empresa.cidade}` }]}
      />

      {/* O que só existe por ser daqui */}
      <section className="container-x pb-20">
        <div className="grid gap-5 sm:grid-cols-3">
          {[
            {
              titulo: "Retirada em mãos",
              corpo: `Quem é de ${site.empresa.cidade} combina a retirada por WhatsApp e não paga frete nenhum.`,
            },
            {
              titulo: "Conversa antes de imprimir",
              corpo:
                "Peça difícil de explicar por mensagem a gente resolve falando: você mostra a peça, a gente diz se dá.",
            },
            {
              titulo: "Sem espera de transportadora",
              corpo:
                "Pronta é pronta. Não entra na fila dos Correios para atravessar o estado.",
            },
          ].map((item, i) => (
            <Reveal key={item.titulo} delay={i * 0.05}>
              <div className="glass border-glow h-full rounded-2xl p-6">
                <h2 className="font-display text-base font-bold text-white">
                  {item.titulo}
                </h2>
                <p className="mt-2 text-xs leading-relaxed text-silver-400">
                  {item.corpo}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* O que dá para fazer */}
      <section className="container-x pb-20">
        <Reveal>
          <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">
            O que a gente imprime
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-silver-400">
            Tudo é impresso aqui, peça por peça, em PLA ou PETG. Não trabalhamos
            com resina, ABS nem nylon.
          </p>
        </Reveal>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {oQueFazemos.map((item, i) => (
            <Reveal key={item.titulo} delay={i * 0.04}>
              <div className="glass h-full rounded-2xl p-6">
                <h3 className="font-display text-base font-bold text-white">
                  {item.titulo}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-silver-400">
                  {item.corpo}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Como começa */}
      <section className="container-x pb-24">
        <Reveal className="glass border-glow rounded-3xl p-8 sm:p-10">
          <h2 className="font-display text-xl font-bold text-white sm:text-2xl">
            Como pedir
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-silver-400">
            Mande o que você tem: arquivo 3D, foto, desenho ou só a medida. A
            gente responde em até 24 horas úteis com o preço fechado e diz se dá
            para retirar aqui ou se compensa enviar. {site.prazo.urgencia}
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/orcamento"
              className="rounded-full bg-white px-7 py-3.5 font-semibold text-ink transition-all duration-300 hover:bg-cyan-300 hover:shadow-glow"
            >
              Pedir orçamento
            </Link>
            <a
              href={whatsappLink(
                `Olá! Sou de ${site.empresa.cidade} e queria um orçamento de impressão 3D.`,
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-white/15 px-7 py-3.5 font-semibold text-white transition-colors hover:border-cyan-400/40 hover:text-cyan-300"
            >
              Falar no WhatsApp
            </a>
            <Link
              href="/loja"
              className="rounded-full border border-white/15 px-7 py-3.5 font-semibold text-white transition-colors hover:border-cyan-400/40 hover:text-cyan-300"
            >
              Ver peças prontas
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
