import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { Atualizado, Destaque, Lista, Secao } from "@/components/TextoLegal";
import { site, whatsappLink } from "@/lib/site";

export const metadata: Metadata = {
  title: "Trocas e devoluções",
  description:
    "Como devolver, trocar ou pedir reembolso na Moldarte 3D: prazos, o que fazer e quem paga o frete.",
};

export default function TrocasPage() {
  return (
    <>
      <PageHeader
        eyebrow="Depois da compra"
        title="Trocas e devoluções"
        description="Chegou errado, quebrado ou você mudou de ideia? Aqui está o caminho, com prazos e quem paga o quê."
        breadcrumbs={[{ label: "Trocas e devoluções" }]}
      />

      <div className="container-x pb-24">
        <div className="max-w-3xl">
          <Secao numero={1} titulo="Mudou de ideia — 7 dias">
            <p>
              Comprou pela internet e se arrependeu? Você tem{" "}
              <strong className="text-white">7 dias corridos</strong> a partir do
              recebimento para desistir, sem precisar dar explicação. É o artigo
              49 do Código de Defesa do Consumidor.
            </p>
            <p>
              Devolvemos <strong className="text-white">tudo</strong> que você
              pagou, incluindo o frete, e o custo da devolução é nosso. A peça
              precisa voltar sem uso e com a embalagem.
            </p>
            <Destaque>
              Peça personalizada — com seu nome, sua logo ou modelada a partir de
              arquivo seu — não pode ser revendida a mais ninguém. Nesses casos,
              avalie bem a prévia antes de aprovar: depois de a produção começar,
              a devolução por arrependimento pode não ser possível. Fale com a
              gente que a gente busca uma saída.
            </Destaque>
          </Secao>

          <Secao numero={2} titulo="Chegou quebrada ou errada">
            <p>
              Aí a conversa é outra: o erro foi nosso e a solução é por nossa
              conta, sem prazo de 7 dias limitando nada.
            </p>
            <Lista
              itens={[
                "Mande uma foto pelo WhatsApp assim que perceber, de preferência em até 7 dias do recebimento.",
                "Reimprimimos e reenviamos sem custo, ou devolvemos o valor — você escolhe.",
                "Não precisa devolver a peça danificada, salvo se combinarmos o contrário.",
              ]}
            />
          </Secao>

          <Secao numero={3} titulo="Defeito que aparece depois">
            <p>
              Para problema de fabricação percebido com o uso, o Código de Defesa
              do Consumidor dá{" "}
              <strong className="text-white">90 dias</strong> a partir do
              recebimento. Consertamos, trocamos ou devolvemos o valor.
            </p>
            <p>
              Não cobre desgaste por uso, quebra por queda ou peça deixada em
              lugar muito quente — PLA começa a amolecer por volta de 55 °C, e
              carro fechado ao sol passa disso fácil.
            </p>
          </Secao>

          <Secao numero={4} titulo="O que não é defeito">
            <p>
              Impressão 3D tem características próprias, e vale saber antes de
              comprar:
            </p>
            <Lista
              itens={[
                "Linhas de camada visíveis — é a assinatura do processo, aparecem em qualquer peça impressa.",
                "Pequena diferença de tom entre lotes de filamento da mesma cor.",
                "Marcas leves onde havia suporte, em regiões que ficam escondidas na montagem.",
                "Variação de milímetros na medida final, dentro da tolerância informada.",
              ]}
            />
            <p>
              Ficou em dúvida se o que você recebeu é isso ou é defeito? Manda a
              foto. A gente prefere olhar a deixar você na dúvida.
            </p>
          </Secao>

          <Secao numero={5} titulo="Como pedir">
            <p>
              Chame no WhatsApp{" "}
              <a
                href={whatsappLink(
                  "Olá! Preciso resolver uma troca ou devolução de um pedido.",
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 underline-offset-2 hover:underline"
              >
                {site.contact.whatsappLabel}
              </a>{" "}
              ou escreva para{" "}
              <a
                href={`mailto:${site.contact.email}`}
                className="text-cyan-400 underline-offset-2 hover:underline"
              >
                {site.contact.email}
              </a>
              , com o número do pedido e, se for o caso, a foto.
            </p>
            <p>
              Respondemos em até 2 dias úteis com as instruções. Sem formulário
              complicado e sem número de protocolo para decorar.
            </p>
          </Secao>

          <Secao numero={6} titulo="Prazo do reembolso">
            <p>
              Confirmada a devolução, o reembolso sai em até 10 dias úteis, pelo
              mesmo meio do pagamento. Em cartão, o estorno pode aparecer só na
              fatura seguinte — isso depende do banco, não de nós.
            </p>
            <p>
              As condições gerais da compra estão nos{" "}
              <Link
                href="/termos"
                className="text-cyan-400 underline-offset-2 hover:underline"
              >
                termos de compra
              </Link>
              .
            </p>
          </Secao>

          <Atualizado em="12 de agosto de 2026" />
        </div>
      </div>
    </>
  );
}
