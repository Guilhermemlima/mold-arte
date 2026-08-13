import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import { Atualizado, Destaque, Lista, Secao } from "@/components/TextoLegal";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Política de privacidade",
  description:
    "Quais dados a Moldarte 3D coleta, para que usa, com quem compartilha e como você pode pedir para apagar.",
};

export default function PrivacidadePage() {
  return (
    <>
      <PageHeader
        eyebrow="LGPD"
        title="Política de privacidade"
        description="O que fazemos com os seus dados — e o que não fazemos."
        breadcrumbs={[{ label: "Privacidade" }]}
      />

      <div className="container-x pb-24">
        <div className="max-w-3xl">
          <Secao numero={1} titulo="Quem cuida dos seus dados">
            <p>
              <strong className="text-white">{site.empresa.razaoSocial}</strong>,
              CNPJ {site.empresa.cnpj}, de {site.empresa.cidade}/
              {site.empresa.uf}, é a controladora dos dados coletados nesta loja.
            </p>
            <p>
              Para qualquer assunto envolvendo seus dados, fale pelo WhatsApp{" "}
              {site.contact.whatsappLabel} ou por{" "}
              <a
                href={`mailto:${site.contact.email}`}
                className="text-cyan-400 underline-offset-2 hover:underline"
              >
                {site.contact.email}
              </a>
              .
            </p>
          </Secao>

          <Secao numero={2} titulo="O que coletamos">
            <p>Só o necessário para a compra acontecer:</p>
            <Lista
              itens={[
                <>
                  <strong className="text-white">Para o pedido:</strong> nome,
                  e-mail, telefone e endereço de entrega.
                </>,
                <>
                  <strong className="text-white">Para a nota fiscal:</strong> CPF
                  ou CNPJ, quando informado.
                </>,
                <>
                  <strong className="text-white">Para o orçamento:</strong> o que
                  você escrever no formulário e os arquivos que anexar.
                </>,
              ]}
            />
            <p>
              Não pedimos dados que não usamos, e não coletamos nada de forma
              escondida.
            </p>
          </Secao>

          <Secao numero={3} titulo="Para que usamos">
            <Lista
              itens={[
                "Produzir, embalar e entregar o que você comprou.",
                "Avisar você sobre o andamento do pedido.",
                "Emitir documento fiscal, quando aplicável.",
                "Responder o que você perguntar pelos formulários.",
              ]}
            />
            <p>
              A base legal é a execução do contrato de compra e o cumprimento de
              obrigação legal. Newsletter só vai para quem pediu, e o pedido de
              saída é atendido na hora.
            </p>
            <Destaque>
              Não vendemos, alugamos nem cedemos seus dados para terceiros
              usarem em publicidade. Nunca.
            </Destaque>
          </Secao>

          <Secao numero={4} titulo="Com quem compartilhamos">
            <p>
              Apenas com quem precisa participar para a compra funcionar, e só o
              mínimo necessário:
            </p>
            <Lista
              itens={[
                <>
                  <strong className="text-white">Supabase</strong> — onde os
                  pedidos ficam armazenados.
                </>,
                <>
                  <strong className="text-white">Vercel</strong> — onde o site
                  roda.
                </>,
                <>
                  <strong className="text-white">Resend</strong> — que entrega os
                  e-mails de confirmação.
                </>,
                <>
                  <strong className="text-white">Transportadora</strong> — recebe
                  nome e endereço para conseguir entregar.
                </>,
                <>
                  <strong className="text-white">Autoridades</strong> — se houver
                  ordem judicial ou obrigação legal.
                </>,
              ]}
            />
            <p>
              Parte desses serviços tem servidores fora do Brasil, o que a LGPD
              permite desde que o nível de proteção seja adequado.
            </p>
          </Secao>

          <Secao numero={5} titulo="Cookies e o que fica no seu navegador">
            <p>
              Este site <strong className="text-white">não usa</strong> cookies
              de rastreamento, nem pixel de rede social, nem ferramenta de
              análise de audiência.
            </p>
            <p>
              O que guardamos fica no seu próprio navegador e nunca sai dele
              sozinho: o conteúdo do carrinho, para você não perder o que
              escolheu ao fechar a aba, e uma marca de que a animação de abertura
              já foi exibida. Limpar os dados do navegador apaga os dois.
            </p>
          </Secao>

          <Secao numero={6} titulo="Por quanto tempo guardamos">
            <p>
              Dados de pedido ficam pelo prazo exigido pela legislação fiscal e
              pelo Código de Defesa do Consumidor — em regra, cinco anos.
              Mensagens de contato e orçamento ficam enquanto forem úteis para o
              atendimento, e depois são apagadas.
            </p>
          </Secao>

          <Secao numero={7} titulo="Seus direitos">
            <p>A LGPD garante que você pode, a qualquer momento:</p>
            <Lista
              itens={[
                "Saber quais dados temos sobre você.",
                "Corrigir o que estiver errado ou desatualizado.",
                "Pedir uma cópia dos seus dados.",
                "Pedir a exclusão do que não formos obrigados a guardar por lei.",
                "Retirar o consentimento da newsletter.",
                "Reclamar à Autoridade Nacional de Proteção de Dados (ANPD).",
              ]}
            />
            <p>
              Basta pedir pelo WhatsApp ou e-mail. Respondemos em até 15 dias.
              Podemos pedir uma confirmação de identidade antes — é para
              proteger você de alguém se passar por você.
            </p>
          </Secao>

          <Secao numero={8} titulo="Segurança">
            <p>
              O site trafega em conexão criptografada, e o acesso ao banco é
              restrito por regras que limitam o que cada parte enxerga. Dados de
              cartão não passam nem ficam guardados aqui: quando o pagamento
              online entrar no ar, ele será processado direto pelo provedor
              contratado.
            </p>
            <p>
              Nenhum sistema é infalível. Se acontecer um incidente que possa te
              afetar, avisamos você e a ANPD, como a lei manda.
            </p>
          </Secao>

          <Atualizado em="12 de agosto de 2026" />
        </div>
      </div>
    </>
  );
}
