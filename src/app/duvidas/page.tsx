import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import Reveal from "@/components/Reveal";
import { site, siteUrl, whatsappLink } from "@/lib/site";
import { menorPiso, regioesDoMenorPiso } from "@/lib/frete";
import { brl } from "@/lib/format";

/**
 * Perguntas frequentes.
 *
 * Existe por dois motivos práticos: cortar a mensagem repetida no WhatsApp e
 * responder no Google a pergunta que a pessoa digita antes de comprar. As
 * respostas ficam num array só porque elas também viram dados estruturados —
 * escrever duas vezes seria garantia de divergir.
 */

export const metadata: Metadata = {
  title: "Dúvidas frequentes",
  description:
    "Prazo de produção, materiais, frete, trocas e cuidados com a peça " +
    "impressa em 3D. As perguntas que mais chegam na Moldarte 3D, respondidas.",
  alternates: { canonical: `${siteUrl}/duvidas` },
};

const perguntas = [
  {
    p: "Quanto tempo leva para ficar pronto?",
    r: "Cada peça é impressa depois que você compra — não fica pronta na prateleira. O prazo de produção aparece na página de cada produto e costuma ficar entre 3 e 7 dias úteis, mais o tempo dos Correios. Peças grandes ou com pintura à mão levam mais.",
  },
  {
    p: "De que material são feitas as peças?",
    r: "PLA e PETG. O PLA tem o melhor acabamento e a maior variedade de cores, e é o que usamos em decoração e colecionável. O PETG aguenta impacto, sol e umidade, e é o que vai em peça funcional ou que fica na área externa. Não trabalhamos com resina, ABS ou nylon.",
  },
  {
    p: "Posso mandar meu próprio arquivo?",
    r: "Pode. Mande o STL, OBJ, 3MF ou STEP na página de orçamento e a gente responde com preço e prazo. Se você não tem o arquivo, também modelamos — basta descrever a peça ou mandar fotos com uma régua ao lado para a gente entender o tamanho.",
  },
  {
    p: "Quanto custa o frete?",
    r: `O valor depende da região e aparece no checkout assim que você informa o CEP. Acima de ${brl(menorPiso())} o frete sai grátis no ${regioesDoMenorPiso().join(" e ")}; nas outras regiões o valor mínimo é um pouco maior, e também aparece na hora.`,
  },
  {
    p: "Como acompanho meu pedido?",
    r: "Na página Acompanhar pedido, com o número do pedido e o e-mail da compra. Não precisa criar conta. Assim que despacharmos, o código de rastreio dos Correios aparece lá e também chega no seu e-mail.",
  },
  {
    p: "Posso escolher a cor?",
    r: "Quando a peça tem opções de cor, elas aparecem na página do produto. Se você quer uma cor específica que não está listada, escreva no campo de observações do pedido ou chame no WhatsApp antes de comprar — quase sempre dá para fazer.",
  },
  {
    p: "Dá para pedir uma pose ou um detalhe diferente?",
    r: "Dá, e é melhor avisar antes da produção começar. Use o campo de observações no checkout para contar o que você quer — uma pose específica, um nome na base, um encaixe diferente. Depois de impressa não há como mudar.",
  },
  {
    p: "Como pago?",
    r: "Pix, boleto ou cartão de crédito, na página de pagamento do Asaas. Os dados do cartão não passam pelo nosso site em momento nenhum. Suas peças ficam reservadas por 24 horas enquanto o pagamento não cai.",
  },
  {
    p: "Posso trocar ou devolver?",
    r: "Pode. Compra pela internet dá direito a arrependimento em até 7 dias corridos após receber, sem precisar justificar. Peça com defeito a gente resolve sempre. A exceção é a peça feita sob medida a partir do seu arquivo ou personalizada com nome — essa não tem como revender. Os detalhes estão na página de Trocas e devoluções.",
  },
  {
    p: "Como cuido da peça?",
    r: "Limpe com pano macio levemente úmido, sem álcool e sem produto abrasivo. Evite deixar dentro do carro fechado ou no sol direto por muito tempo: o PLA começa a amolecer perto dos 55 °C. Se a peça for ficar exposta ao tempo, peça em PETG.",
  },
  {
    p: "Vocês fazem peça em quantidade?",
    r: "Fazemos. O preço por unidade cai conforme a quantidade, e a tabela aparece na própria página do produto. Para lotes maiores ou brindes personalizados, peça um orçamento que a gente monta uma proposta.",
  },
  {
    p: "A cor da foto é exatamente a que eu vou receber?",
    r: "Quase. As fotos são das peças reais, mas cor de tela varia de aparelho para aparelho, e filamento tem pequena variação entre lotes. Se a cor exata for importante para você, fale com a gente antes que mandamos uma foto do filamento atual.",
  },
];

export default function DuvidasPage() {
  return (
    <>
      {/* Dados estruturados: é o que faz a resposta aparecer direto no Google. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: perguntas.map((item) => ({
              "@type": "Question",
              name: item.p,
              acceptedAnswer: { "@type": "Answer", text: item.r },
            })),
          }),
        }}
      />

      <PageHeader
        eyebrow="Dúvidas"
        title="O que mais perguntam"
        description="Prazo, material, frete e trocas. Se sua dúvida não estiver aqui, é só chamar."
        breadcrumbs={[{ label: "Dúvidas frequentes" }]}
      />

      <div className="container-x pb-28">
        <div className="mx-auto max-w-3xl">
          <Reveal stagger={0.04} className="space-y-3">
            {perguntas.map((item) => (
              <details
                key={item.p}
                className="glass group rounded-2xl border border-white/10 px-6 py-5 transition-colors open:border-cyan-400/25"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-[15px] font-semibold text-white marker:hidden">
                  {item.p}
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    className="shrink-0 text-cyan-400 transition-transform duration-300 group-open:rotate-45"
                    aria-hidden
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </summary>
                <p className="mt-3.5 text-sm leading-relaxed text-silver-400">
                  {item.r}
                </p>
              </details>
            ))}
          </Reveal>

          <div className="glass border-glow mt-10 rounded-3xl p-8 text-center">
            <h2 className="font-display text-xl font-bold text-white">
              Não achou sua dúvida?
            </h2>
            <p className="mx-auto mt-2.5 max-w-md text-sm leading-relaxed text-silver-400">
              Manda a pergunta que a gente responde — e se for boa, ela entra
              nesta página para ajudar quem vier depois.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <a
                href={whatsappLink("Olá! Tenho uma dúvida sobre as peças.")}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-white px-7 py-3 text-sm font-semibold text-ink transition-all duration-300 hover:bg-cyan-300 hover:shadow-glow"
              >
                WhatsApp {site.contact.whatsappLabel}
              </a>
              <Link
                href="/contato"
                className="rounded-full border border-white/15 px-7 py-3 text-sm font-medium text-white transition-colors hover:border-cyan-400/40 hover:text-cyan-300"
              >
                Mandar mensagem
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
