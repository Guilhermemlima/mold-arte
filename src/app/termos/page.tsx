import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { Atualizado, Destaque, Lista, Secao } from "@/components/TextoLegal";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Termos de compra",
  description:
    "Condições de venda da Moldarte 3D: prazos, pagamento, produção e direito de arrependimento.",
};

export default function TermosPage() {
  return (
    <>
      <PageHeader
        eyebrow="Condições"
        title="Termos de compra"
        description="As regras da venda, em português. Se algo aqui não estiver claro, chame no WhatsApp antes de comprar."
        breadcrumbs={[{ label: "Termos de compra" }]}
      />

      <div className="container-x pb-24">
        <div className="max-w-3xl">
          <Secao numero={1} titulo="Quem está vendendo">
            <p>
              A loja Moldarte 3D é operada por{" "}
              <strong className="text-white">{site.empresa.razaoSocial}</strong>,
              inscrita no CNPJ sob o número{" "}
              <strong className="text-white">{site.empresa.cnpj}</strong>,
              estabelecida em {site.empresa.cidade}/{site.empresa.uf}.
            </p>
            <p>
              Contato: {site.contact.whatsappLabel} (WhatsApp) ou{" "}
              <a
                href={`mailto:${site.contact.email}`}
                className="text-cyan-400 underline-offset-2 hover:underline"
              >
                {site.contact.email}
              </a>
              . Atendemos de segunda a sexta, das 9h às 18h, e sábado das 9h às
              13h.
            </p>
          </Secao>

          <Secao numero={2} titulo="O que vendemos">
            <p>
              Peças produzidas por impressão 3D, fabricadas sob demanda. Salvo
              indicação em contrário, cada peça só começa a ser produzida depois
              da confirmação do pedido — não trabalhamos com estoque parado.
            </p>
            <p>
              As fotos são ilustrativas. Impressão 3D deixa linhas de camada
              visíveis, e pode haver pequena variação de tom entre lotes de
              filamento. Isso é característica do processo, não defeito.
            </p>
          </Secao>

          <Secao numero={3} titulo="Preços e pagamento">
            <Lista
              itens={[
                "Os preços aparecem em reais, já com impostos, e não incluem o frete.",
                "Peças com desconto por quantidade têm a tabela exibida na própria página do produto.",
                "O preço que vale é o que estiver publicado no momento em que você finaliza o pedido.",
                "Erro evidente de digitação em preço não obriga a venda: nesse caso avisamos e cancelamos o pedido sem custo para você.",
              ]}
            />
          </Secao>

          <Secao numero={4} titulo="Reserva de 24 horas">
            <p>
              Ao finalizar o pedido, as peças ficam reservadas para você por 24
              horas. Se o pagamento não for confirmado nesse prazo, a reserva cai
              e as peças voltam para a loja — sem nenhuma cobrança.
            </p>
            <Destaque>
              Enquanto o pagamento online não estiver disponível no site, o
              acerto é combinado por WhatsApp depois do pedido. Nada é cobrado
              automaticamente.
            </Destaque>
          </Secao>

          <Secao numero={5} titulo="Prazo de produção e entrega">
            <p>
              Cada peça tem seu prazo de produção informado na página do produto,
              em dias úteis. Ele começa a contar depois da confirmação do
              pagamento — e, em peças personalizadas, depois da sua aprovação da
              prévia.
            </p>
            <p>
              O prazo de entrega é o de produção mais o tempo do transporte, que
              varia conforme a região. Enviamos para todo o Brasil com código de
              rastreio.
            </p>
            <p>
              Atrasos do transportador fogem ao nosso controle, mas a
              responsabilidade de acompanhar e resolver é nossa: se sumir,
              refazemos ou devolvemos o valor.
            </p>
          </Secao>

          <Secao numero={6} titulo="Peças personalizadas">
            <p>
              Peças feitas sob medida — com nome, logo, arquivo enviado por você
              ou modelagem exclusiva — seguem regras próprias:
            </p>
            <Lista
              itens={[
                "Mandamos uma prévia para aprovação antes de imprimir, sempre que houver modelagem envolvida.",
                "Depois de aprovada a prévia e iniciada a produção, o cancelamento pode não ser possível, porque a peça não pode ser revendida a outra pessoa.",
                "Você é responsável por ter o direito de usar o que enviar. Não produzimos peças que violem marca, direito autoral ou que representem conteúdo ilegal.",
              ]}
            />
          </Secao>

          <Secao numero={7} titulo="Direito de arrependimento">
            <p>
              Compra feita pela internet dá a você{" "}
              <strong className="text-white">7 dias corridos</strong>, contados
              do recebimento, para desistir sem precisar justificar — é o artigo
              49 do Código de Defesa do Consumidor.
            </p>
            <p>
              Nesse caso devolvemos tudo que você pagou, inclusive o frete. Para
              exercer, basta avisar pelo WhatsApp ou e-mail dentro do prazo. Veja
              como funciona na{" "}
              <Link
                href="/trocas"
                className="text-cyan-400 underline-offset-2 hover:underline"
              >
                política de trocas e devoluções
              </Link>
              .
            </p>
          </Secao>

          <Secao numero={8} titulo="Cancelamento pela loja">
            <p>
              Podemos cancelar um pedido, devolvendo integralmente o que foi
              pago, quando: a peça se mostrar inviável de produzir, houver erro
              evidente de preço, os dados de entrega estiverem incorretos e não
              conseguirmos contato, ou o pedido tiver indício de fraude.
            </p>
          </Secao>

          <Secao numero={9} titulo="Seus dados">
            <p>
              Usamos seus dados apenas para processar o pedido, emitir documento
              fiscal e entregar. O detalhamento está na{" "}
              <Link
                href="/privacidade"
                className="text-cyan-400 underline-offset-2 hover:underline"
              >
                política de privacidade
              </Link>
              .
            </p>
          </Secao>

          <Secao numero={10} titulo="Foro">
            <p>
              Aplica-se a lei brasileira. Consumidor pode processar no foro do
              seu próprio domicílio, conforme o Código de Defesa do Consumidor.
            </p>
          </Secao>

          <Atualizado em="12 de agosto de 2026" />
        </div>
      </div>
    </>
  );
}
