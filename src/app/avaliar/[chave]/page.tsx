import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import AvaliarClient from "@/components/avaliar/AvaliarClient";
import { pedidoPelaChave } from "@/lib/avaliacoes";

/**
 * Página de avaliar, aberta pelo link do e-mail.
 *
 * Sem login de propósito: ninguém cria conta para dizer que gostou de um vaso.
 * Quem garante que só o comprador avalia é a chave do pedido na URL — sorteada,
 * enviada só para ele, e conferida aqui no servidor antes de a tela aparecer.
 */

export const dynamic = "force-dynamic";

// Página de link privado não entra em buscador.
export const metadata: Metadata = {
  title: "Avaliar minha compra",
  robots: { index: false, follow: false },
};

export default async function AvaliarPage({
  params,
}: {
  params: Promise<{ chave: string }>;
}) {
  const { chave } = await params;
  const pedido = await pedidoPelaChave(chave);

  const naoServe =
    !pedido || (pedido.status !== "entregue" && pedido.status !== "pago");

  if (naoServe) {
    return (
      <>
        <PageHeader
          eyebrow="Avaliação"
          title="Esse link não vale mais"
          description="Ou o endereço veio incompleto, ou o pedido foi cancelado."
        />
        <div className="container-x pb-28">
          <div className="glass border-glow mx-auto max-w-xl rounded-3xl p-8 text-center">
            <p className="text-sm leading-relaxed text-silver-400">
              Se você recebeu o convite por e-mail, tente abrir de novo pelo
              próprio e-mail — às vezes o link quebra ao ser copiado. Se mesmo
              assim não abrir, a gente resolve pelo WhatsApp.
            </p>
            <Link
              href="/contato"
              className="mt-7 inline-flex rounded-full border border-white/15 px-7 py-3 text-sm font-medium text-white transition-colors hover:border-cyan-400/40 hover:text-cyan-300"
            >
              Falar com a gente
            </Link>
          </div>
        </div>
      </>
    );
  }

  // Uma avaliação por peça comprada. Quem levou três peças diferentes tem três
  // opiniões diferentes para dar, e juntar tudo numa nota só perderia isso.
  const itens = (pedido.itens ?? [])
    .filter((i) => i.slug)
    .map((i) => ({
      slug: i.slug as string,
      nome: i.nome ?? (i.slug as string),
      tamanho: i.tamanho ?? null,
    }));

  return (
    <>
      <PageHeader
        eyebrow={`Pedido ${pedido.id}`}
        title="O que você achou?"
        description="Sua opinião aparece na página da peça e ajuda quem chega depois de você a decidir."
      />
      <div className="container-x pb-28">
        <AvaliarClient chave={chave} itens={itens} />
      </div>
    </>
  );
}
