import { NextResponse } from "next/server";
import { dono, insere } from "@/lib/admin";
import { pedidoPelaChave } from "@/lib/avaliacoes";

/**
 * Avaliação de quem comprou.
 *
 * Não existe login, e mesmo assim ninguém avalia um produto que não comprou: o
 * direito vem da **chave do pedido**, sorteada na criação e enviada só no
 * e-mail de convite. Sem a chave certa não se grava nada, e a chave não dá
 * para adivinhar.
 *
 * A avaliação nasce escondida. Você libera no Precifica antes de ela aparecer
 * no site — não para esconder nota baixa, mas para segurar spam e dado pessoal
 * que a pessoa escreveu sem perceber no meio do texto.
 */

export const dynamic = "force-dynamic";

export async function POST(requisicao: Request) {
  let corpo: Record<string, unknown>;
  try {
    corpo = await requisicao.json();
  } catch {
    return NextResponse.json({ ok: false, recado: "Não entendi." }, { status: 400 });
  }

  const chave = String(corpo.chave ?? "").trim();
  const pedido = await pedidoPelaChave(chave);

  if (!pedido) {
    return NextResponse.json(
      { ok: false, recado: "Esse link de avaliação não vale mais." },
      { status: 404 },
    );
  }

  // Avaliar antes de receber não faz sentido, e um pedido cancelado não dá
  // direito a nada.
  if (pedido.status !== "entregue" && pedido.status !== "pago") {
    return NextResponse.json(
      { ok: false, recado: "Esse pedido ainda não foi entregue." },
      { status: 409 },
    );
  }

  const slug = String(corpo.slug ?? "").trim();
  // Só vale avaliar o que estava neste pedido.
  const comprou = (pedido.itens ?? []).some((i) => i.slug === slug);
  if (!comprou) {
    return NextResponse.json(
      { ok: false, recado: "Essa peça não estava no seu pedido." },
      { status: 409 },
    );
  }

  const nota = Math.round(Number(corpo.nota));
  if (!(nota >= 1 && nota <= 5)) {
    return NextResponse.json(
      { ok: false, recado: "Escolha de 1 a 5 estrelas." },
      { status: 400 },
    );
  }

  const nome =
    String(corpo.nome ?? "").trim().slice(0, 60) ||
    (pedido.cliente?.nome ?? "Cliente").split(" ")[0];

  const gravada = await insere("avaliacoes", {
    usuario: dono,
    slug,
    pedido_id: pedido.id,
    nome,
    nota,
    comentario: String(corpo.comentario ?? "").trim().slice(0, 1500) || null,
  });

  if (!gravada.ok) {
    // O índice único segura a segunda avaliação da mesma peça no mesmo
    // pedido. Para quem está do outro lado isso não é erro: já está feito.
    if (gravada.erro.includes("duplicate key")) {
      return NextResponse.json({ ok: true, jaAvaliou: true });
    }
    return NextResponse.json(
      { ok: false, recado: "Não consegui salvar sua avaliação. Tente de novo." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
