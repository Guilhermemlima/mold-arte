import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import Reveal from "@/components/Reveal";
import BrindeForm from "@/components/brindes/BrindeForm";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Chaveiros e brindes personalizados para empresas",
  description:
    "Chaveiros, ímãs, troféus e lembrancinhas impressos em 3D com a marca da sua empresa. Peça a proposta com preço por peça e prazo em até 24 horas úteis.",
};

/**
 * Página de brindes corporativos.
 *
 * O visitante daqui é diferente do que compra uma peça na loja: ele não está
 * escolhendo um produto, está resolvendo um problema com data marcada — o
 * evento, a feira, a confraternização. Por isso a página não vende peça, e sim
 * responde as três perguntas que decidem se ele pede orçamento: dá para fazer
 * com a minha marca, quanto tempo leva, e quantas eu preciso pedir.
 *
 * Não há preço nesta página de propósito. Chaveiro de 3 cm e troféu de 20 cm
 * não têm o mesmo custo, e um "a partir de" chutado vira ou promessa quebrada
 * na proposta, ou dinheiro deixado na mesa.
 */

const oQueDaParaFazer = [
  {
    titulo: "Chaveiro com logo",
    corpo:
      "O mais pedido. A marca sai em relevo ou vazada, em uma ou duas cores, e o tamanho costuma ficar entre 4 e 6 cm.",
  },
  {
    titulo: "Ímã de geladeira",
    corpo:
      "Fica à vista todo dia na casa do cliente. Mesmo desenho do chaveiro, com ímã embutido na peça.",
  },
  {
    titulo: "Troféu e premiação",
    corpo:
      "Para campanha interna, meta batida ou torneio. Dá para gravar nome e data em cada unidade sem custo de molde.",
  },
  {
    titulo: "Peça de mesa",
    corpo:
      "Porta-cartão, porta-caneta, suporte de celular com a marca. Brinde que fica na mesa de quem decide a compra.",
  },
  {
    titulo: "Lembrancinha de evento",
    corpo:
      "Feira, congresso, confraternização. Conte a data no formulário — a produção é agendada de trás para frente.",
  },
  {
    titulo: "Uma ideia que não está aqui",
    corpo:
      "Se a peça existe como desenho, foto ou só na sua cabeça, dá para modelar. É o mesmo trabalho de sempre.",
  },
];

const comoFunciona = [
  {
    titulo: "Você manda a marca",
    corpo:
      "O arquivo do logo em qualquer formato — e se você não tiver, uma foto do cartão resolve.",
  },
  {
    titulo: "A proposta chega em 24h úteis",
    corpo:
      "Preço por peça, prazo e a prévia em 3D de como a marca fica na peça. Sem taxa escondida.",
  },
  {
    titulo: "Você aprova a prévia",
    corpo:
      "Nada é impresso antes do seu aceite. Ajuste de tamanho, cor ou posição do logo entra nesta etapa.",
  },
  {
    titulo: "Produção e entrega",
    corpo: `Lote típico fica pronto em ${site.brindes.prazoDias} dias úteis contados da aprovação. Envio para todo o Brasil ou retirada.`,
  },
];

const duvidas = [
  {
    q: "Qual o pedido mínimo?",
    a: `${site.brindes.minimo} peças. Abaixo disso o tempo de preparar a arte e ajustar o modelo custa mais do que o lote rende — mas se o seu caso for menor, mande assim mesmo que a gente conversa.`,
  },
  {
    q: "Quanto custa por peça?",
    a: "Depende do tamanho, do número de cores e da quantidade — e cai bastante conforme o lote cresce. Por isso a proposta é feita para o seu pedido, e não uma tabela genérica que sempre erra para algum lado.",
  },
  {
    q: "Preciso do arquivo da marca em vetor?",
    a: "Ajuda, mas não é obrigatório. PNG em boa resolução, PDF ou até uma foto do cartão de visita servem — quando o desenho não permite, a gente redesenha e mostra a prévia antes.",
  },
  {
    q: "Dá para colocar o nome de cada pessoa?",
    a: "Dá, e sem custo de molde: cada peça é impressa individualmente. Mande a lista de nomes junto com o pedido que ela entra no orçamento.",
  },
  {
    q: "Em quais cores?",
    a: "Trabalho com PLA e PETG, e a paleta cobre as cores mais usadas em marca. Diga as cores da sua e eu digo na proposta o que consigo chegar mais perto.",
  },
  {
    q: "E se eu precisar repetir o pedido depois?",
    a: "O modelo fica guardado. Repetir é só dizer a quantidade — sem refazer arte nem cobrar preparação de novo.",
  },
];

export default function BrindesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Para empresas"
        title="Sua marca em peça que ninguém joga fora."
        description={`Chaveiros, ímãs, troféus e lembrancinhas impressos em 3D com o logo da sua empresa. Sem custo de molde, a partir de ${site.brindes.minimo} peças — e a proposta com preço e prazo chega em até 24 horas úteis.`}
        breadcrumbs={[{ label: "Brindes para empresas" }]}
      />

      <div className="container-x grid gap-12 pb-24 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
        <BrindeForm />

        <div className="space-y-10">
          <Reveal from="right" className="glass border-glow rounded-2xl p-7">
            <h2 className="font-display text-lg font-bold text-white">
              Como funciona
            </h2>
            <ol className="mt-5 space-y-5">
              {comoFunciona.map((passo, i) => (
                <li key={passo.titulo} className="flex gap-4">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-cyan-400/40 bg-cyan-400/10 font-display text-xs font-bold text-cyan-400">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">{passo.titulo}</p>
                    <p className="mt-1 text-xs leading-relaxed text-silver-400">
                      {passo.corpo}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </Reveal>

          <Reveal from="right" className="glass rounded-2xl p-7">
            <h2 className="font-display text-lg font-bold text-white">
              Sobre o preço
            </h2>
            <p className="mt-3 text-xs leading-relaxed text-silver-400">
              Não tem tabela nesta página porque ela mentiria: um chaveiro de 4
              cm e um troféu de 20 cm não custam a mesma coisa, e a quantidade
              muda o preço por peça mais do que qualquer outro fator.
            </p>
            <p className="mt-3 text-xs leading-relaxed text-silver-400">
              O que dá para adiantar: <strong className="text-white">não
              existe custo de molde</strong>. Em brinde tradicional, o molde é o
              que obriga a pedir milhares de peças para o preço fechar. Aqui o
              lote de {site.brindes.minimo} sai pelo mesmo processo do lote de
              mil — e por isso pedido pequeno é viável.
            </p>
          </Reveal>
        </div>
      </div>

      {/* O que dá para fazer */}
      <section className="container-x pb-24">
        <Reveal>
          <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">
            O que dá para fazer
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-silver-400">
            Tudo impresso aqui, peça por peça. Se o que você precisa não está
            nesta lista, o último item é justamente para isso.
          </p>
        </Reveal>

        <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {oQueDaParaFazer.map((item, i) => (
            <Reveal key={item.titulo} delay={i * 0.05}>
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

      {/* Dúvidas */}
      <section className="container-x pb-28">
        <Reveal>
          <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">
            Antes de pedir
          </h2>
        </Reveal>

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          {duvidas.map((item, i) => (
            <Reveal key={item.q} delay={i * 0.04}>
              <div className="glass h-full rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-white">{item.q}</h3>
                <p className="mt-2 text-xs leading-relaxed text-silver-400">
                  {item.a}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
