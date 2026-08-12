import { NextResponse } from "next/server";

/**
 * Criação de pedido.
 *
 * Esta rota roda **só no servidor** e é a única parte do site que escreve no
 * banco. Ela usa a chave `service_role`, que ignora todas as regras de
 * segurança — por isso ela nunca pode ter o prefixo NEXT_PUBLIC_ nem aparecer
 * em qualquer arquivo que vá para o navegador.
 *
 * O que chega do cliente é tratado como palpite, não como verdade:
 *
 * - o **preço** é recalculado no banco a partir do que está publicado. Sem
 *   isso, bastaria editar o carrinho no navegador para comprar por um real;
 * - o **estoque** é conferido e reservado na mesma transação, com a linha da
 *   peça travada. Dois pedidos simultâneos entram em fila em vez de os dois
 *   levarem a última unidade.
 *
 * Do cliente só aproveitamos o que ele é dono: quais peças, quantas, e os
 * dados de entrega.
 */

export const dynamic = "force-dynamic";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");
const servico = process.env.SUPABASE_SERVICE_ROLE_KEY;
const dono = process.env.NEXT_PUBLIC_SUPABASE_OWNER;

const HORAS_DE_RESERVA = 24;

type ItemRecebido = {
  slug?: unknown;
  quantidade?: unknown;
  tamanho?: unknown;
  opcoes?: unknown;
};

/** Mensagens que o cliente entende, a partir do código que o banco devolve. */
const recados: Record<string, string> = {
  carrinho_vazio: "Seu carrinho está vazio.",
  produto_fora_do_ar:
    "Uma das peças saiu do catálogo enquanto você comprava. Remova ela do carrinho e tente de novo.",
  produto_sob_consulta:
    "Uma das peças é orçada sob consulta e não pode ser comprada direto. Peça um orçamento para ela.",
};

export async function POST(requisicao: Request) {
  if (!url || !servico || !dono) {
    console.error(
      "[pedido] Faltam variáveis: NEXT_PUBLIC_SUPABASE_URL, " +
        "SUPABASE_SERVICE_ROLE_KEY ou NEXT_PUBLIC_SUPABASE_OWNER.",
    );
    return NextResponse.json(
      { ok: false, recado: "A loja está sem conexão com o sistema de pedidos." },
      { status: 503 },
    );
  }

  let corpo: {
    itens?: ItemRecebido[];
    cliente?: Record<string, unknown>;
    entrega?: Record<string, unknown>;
    frete?: unknown;
    pagamento?: unknown;
    observacoes?: unknown;
  };

  try {
    corpo = await requisicao.json();
  } catch {
    return NextResponse.json(
      { ok: false, recado: "Não entendi o pedido." },
      { status: 400 },
    );
  }

  // Só passa adiante o que é do cliente: peça, quantidade e tamanho.
  const itens = (Array.isArray(corpo.itens) ? corpo.itens : [])
    .map((i) => ({
      slug: String(i?.slug ?? "").trim(),
      quantidade: Math.max(1, Math.min(999, Number(i?.quantidade) || 1)),
      tamanho: i?.tamanho ? String(i.tamanho) : null,
      opcoes: i?.opcoes ?? {},
    }))
    .filter((i) => i.slug);

  if (!itens.length) {
    return NextResponse.json(
      { ok: false, recado: recados.carrinho_vazio },
      { status: 400 },
    );
  }

  const numero = `MA3D-${Date.now().toString(36).toUpperCase()}`;

  try {
    const resposta = await fetch(`${url}/rest/v1/rpc/criar_pedido`, {
      method: "POST",
      headers: {
        apikey: servico,
        Authorization: `Bearer ${servico}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
      body: JSON.stringify({
        p_usuario: dono,
        p_id: numero,
        p_cliente: corpo.cliente ?? {},
        p_entrega: corpo.entrega ?? {},
        p_itens: itens,
        p_frete: Number(corpo.frete) || 0,
        p_pagamento: corpo.pagamento ? String(corpo.pagamento) : null,
        p_observacoes: corpo.observacoes ? String(corpo.observacoes) : null,
        p_horas_reserva: HORAS_DE_RESERVA,
      }),
    });

    const texto = await resposta.text();

    if (!resposta.ok) {
      console.error(`[pedido] O banco recusou (${resposta.status}): ${texto}`);
      return NextResponse.json(
        {
          ok: false,
          recado:
            "Não consegui registrar seu pedido agora. Tente de novo em instantes " +
            "ou chame a gente no WhatsApp.",
        },
        { status: 502 },
      );
    }

    const dados = JSON.parse(texto) as {
      ok: boolean;
      erro?: string;
      nome?: string;
      disponivel?: number;
      id?: string;
      total?: number;
    };

    if (!dados.ok) {
      if (dados.erro === "estoque_insuficiente") {
        const restam = dados.disponivel ?? 0;
        return NextResponse.json(
          {
            ok: false,
            erro: dados.erro,
            recado:
              restam > 0
                ? `Sobrou menos do que você pediu de "${dados.nome}": ainda temos ${restam}. Ajuste a quantidade e tente de novo.`
                : `"${dados.nome}" acabou de esgotar. Remova do carrinho para seguir com o resto.`,
          },
          { status: 409 },
        );
      }

      return NextResponse.json(
        {
          ok: false,
          erro: dados.erro,
          recado: recados[dados.erro ?? ""] ?? "Não consegui fechar seu pedido.",
        },
        { status: 409 },
      );
    }

    // O total que vale é o do banco, não o que veio da tela.
    return NextResponse.json({ ok: true, id: dados.id, total: dados.total });
  } catch (erro) {
    console.error("[pedido] Falhou ao falar com o banco:", erro);
    return NextResponse.json(
      {
        ok: false,
        recado:
          "Não consegui registrar seu pedido agora. Tente de novo em instantes.",
      },
      { status: 502 },
    );
  }
}
