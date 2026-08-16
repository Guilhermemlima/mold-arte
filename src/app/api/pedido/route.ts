import { NextResponse } from "next/server";
import { avisaCliente, avisaLojista } from "@/lib/email";
import { clienteAsaas, criarCobranca, descricaoDoPedido } from "@/lib/asaas";
import { calculaFrete } from "@/lib/frete";

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

type PedidoCriado = {
  id: string;
  itens: { nome?: string; quantidade?: number }[];
  total: number;
  cliente: Record<string, string>;
};

/**
 * Cria a cobrança e guarda no pedido qual é a dela.
 *
 * Devolve `null` em qualquer tropeço — sem chave configurada, sem CPF, ou
 * recusa do Asaas. Quem chama trata a ausência como "combinar por WhatsApp",
 * nunca como falha da compra.
 */
/** Ou a cobrança saiu (com url), ou não saiu (com o motivo). Nunca os dois. */
type ResultadoCobranca = { url: string | null; motivo: string | null };

async function geraCobranca(pedido: PedidoCriado): Promise<ResultadoCobranca> {
  const documento = (pedido.cliente?.documento ?? "").replace(/\D/g, "");
  if (!documento) {
    console.warn(`[pedido] ${pedido.id} sem CPF/CNPJ — cobrança não gerada.`);
    return { url: null, motivo: "o CPF/CNPJ chegou vazio" };
  }

  const cliente = await clienteAsaas({
    nome: pedido.cliente?.nome ?? "Cliente",
    email: pedido.cliente?.email,
    telefone: pedido.cliente?.telefone,
    documento,
  });
  if (!cliente.ok) {
    console.error(`[pedido] ${pedido.id}: ${cliente.erro}`);
    return { url: null, motivo: `ao cadastrar o cliente: ${cliente.erro}` };
  }

  const cobranca = await criarCobranca({
    clienteId: cliente.dados,
    pedidoId: pedido.id,
    valor: pedido.total,
    descricao: descricaoDoPedido(pedido.id, pedido.itens),
  });
  if (!cobranca.ok) {
    console.error(`[pedido] ${pedido.id}: ${cobranca.erro}`);
    return { url: null, motivo: `ao criar a cobrança: ${cobranca.erro}` };
  }

  // Guarda no pedido: é o que liga o aviso de pagamento a esta venda, e o que
  // permite reenviar o link se o cliente fechar a aba antes de pagar.
  try {
    await fetch(`${url}/rest/v1/pedidos_loja?id=eq.${encodeURIComponent(pedido.id)}`, {
      method: "PATCH",
      headers: {
        apikey: servico as string,
        Authorization: `Bearer ${servico}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      cache: "no-store",
      body: JSON.stringify({
        pagamento_id: cobranca.dados.id,
        pagamento_url: cobranca.dados.url,
      }),
    });
  } catch (e) {
    // A cobrança existe e o cliente vai conseguir pagar; o que se perde é a
    // confirmação automática, que passa a depender de conferência manual.
    console.error(`[pedido] ${pedido.id}: não gravei a cobrança no banco`, e);
  }

  return { url: cobranca.dados.url, motivo: null };
}

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
    pagamento?: unknown;
    observacoes?: unknown;
    cupom?: unknown;
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

  // A região sai do estado informado na entrega. Estado que a gente não
  // reconhece cai na faixa padrão em vez de derrubar a compra.
  const uf = String((corpo.entrega as Record<string, unknown>)?.uf ?? "");
  const frete = calculaFrete(0, uf);

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
        p_pagamento: corpo.pagamento ? String(corpo.pagamento) : null,
        p_observacoes: corpo.observacoes ? String(corpo.observacoes) : null,
        p_horas_reserva: HORAS_DE_RESERVA,
        p_cupom: corpo.cupom ? String(corpo.cupom) : null,
        // O frete deixou de vir do navegador: a loja informa só a tabela, e a
        // conta é feita no banco. Antes bastava alterar o valor na tela para
        // pagar frete zero.
        // Calculado aqui a partir do estado da entrega, não recebido da tela.
        // O navegador informa para onde vai; quanto custa quem decide é o
        // servidor. Se o frete viesse pronto do carrinho, bastaria editar o
        // valor antes de enviar para pagar zero.
        p_frete_padrao: frete.tabela,
        p_frete_gratis_acima: frete.gratisAcima,
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
      subtotal?: number;
      frete?: number;
      desconto?: number;
      cupom?: string | null;
      recado?: string;
      itens?: {
        nome?: string;
        slug?: string;
        tamanho?: string | null;
        quantidade?: number;
        precoUnitario?: number;
        total?: number;
      }[];
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
          // O cupom já vem com a explicação pronta do banco: qual é o mínimo,
          // se venceu, se acabou. Repetir isso aqui só criaria divergência.
          recado:
            dados.recado ??
            recados[dados.erro ?? ""] ??
            "Não consegui fechar seu pedido.",
        },
        { status: 409 },
      );
    }

    // A venda já está gravada e o estoque reservado. Daqui para frente nada
    // pode desfazer isso: se o aviso falhar, o pedido continua de pé e o
    // problema vira só a notificação.
    const pedido = {
      id: dados.id as string,
      itens: dados.itens ?? [],
      subtotal: dados.subtotal ?? 0,
      // Frete, desconto e total saem do banco — é lá que a conta é fechada.
      frete: dados.frete ?? 0,
      desconto: dados.desconto ?? 0,
      cupom: dados.cupom ?? null,
      total: dados.total ?? 0,
      pagamento: corpo.pagamento ? String(corpo.pagamento) : null,
      cliente: (corpo.cliente ?? {}) as Record<string, string>,
      entrega: (corpo.entrega ?? {}) as Record<string, string>,
      observacoes: corpo.observacoes ? String(corpo.observacoes) : null,
    };

    // Cobrança no Asaas. Se falhar, a venda continua de pé e o acerto volta a
    // ser combinado pelo WhatsApp — perder o pedido por causa disso seria bem
    // pior do que cobrar de outro jeito.
    const cobranca = await geraCobranca(pedido);

    const comCobranca = { ...pedido, pagamentoUrl: cobranca?.url ?? null };

    const [, avisoAoCliente] = await Promise.all([
      // O lojista precisa saber se a cobrança saiu: sem ela, o cliente está
      // esperando o contato dele e não vai receber link nenhum sozinho.
      avisaLojista(comCobranca).catch(() => false),
      avisaCliente(comCobranca).catch(() => false),
    ]);

    // O total que vale é o do banco, não o que veio da tela.
    return NextResponse.json({
      ok: true,
      id: dados.id,
      total: dados.total,
      // A tela de confirmação só promete o e-mail se ele saiu de verdade.
      avisoAoCliente,
      pagamentoUrl: cobranca?.url ?? null,
    });
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
