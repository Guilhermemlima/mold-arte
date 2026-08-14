import { NextResponse } from "next/server";

/**
 * Aviso de pagamento vindo do Asaas.
 *
 * O Asaas chama esta rota quando algo acontece com uma cobrança. É assim que
 * o pedido vira "pago" sozinho, sem você precisar conferir extrato e marcar
 * na mão.
 *
 * Ninguém pode fingir ser o Asaas: a rota exige o token que você cadastra
 * junto com o webhook no painel deles. Sem isso, qualquer um poderia declarar
 * pedidos como pagos.
 */

export const dynamic = "force-dynamic";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");
const servico = process.env.SUPABASE_SERVICE_ROLE_KEY;
const dono = process.env.NEXT_PUBLIC_SUPABASE_OWNER;
const token = process.env.ASAAS_WEBHOOK_TOKEN;

/** Pagamento entrou. */
const PAGOS = new Set([
  "PAYMENT_RECEIVED",
  "PAYMENT_CONFIRMED",
  "PAYMENT_RECEIVED_IN_CASH",
]);

/** Pagamento desfeito ou cobrança cancelada — as peças voltam para a loja. */
const DESFEITOS = new Set([
  "PAYMENT_REFUNDED",
  "PAYMENT_DELETED",
  "PAYMENT_CHARGEBACK_REQUESTED",
  "PAYMENT_REVERSED",
]);

function supabase(caminho: string, opcoes: RequestInit = {}) {
  return fetch(`${url}/rest/v1${caminho}`, {
    ...opcoes,
    headers: {
      apikey: servico as string,
      Authorization: `Bearer ${servico}`,
      "Content-Type": "application/json",
      ...(opcoes.headers ?? {}),
    },
    cache: "no-store",
  });
}

export async function POST(requisicao: Request) {
  if (!url || !servico) {
    console.error("[webhook] Faltam as variáveis do Supabase.");
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  // Variável não cadastrada e token errado são problemas diferentes, e
  // responder o mesmo para os dois deixa quem está configurando no escuro.
  // A rota continua recusando nos dois casos — só passa a dizer qual é.
  if (!token) {
    console.error("[webhook] ASAAS_WEBHOOK_TOKEN não configurado na Vercel.");
    return NextResponse.json(
      {
        ok: false,
        recado:
          "Falta a variável ASAAS_WEBHOOK_TOKEN. Enquanto isso, nenhum aviso " +
          "de pagamento é aceito, e os pedidos ficam presos em 'reservado'.",
      },
      { status: 503 },
    );
  }

  if (requisicao.headers.get("asaas-access-token") !== token) {
    console.warn("[webhook] Chamada recusada: token diferente do cadastrado.");
    return NextResponse.json(
      { ok: false, recado: "token inválido" },
      { status: 401 },
    );
  }

  let evento: { event?: string; payment?: { id?: string; externalReference?: string } };
  try {
    evento = await requisicao.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const tipo = evento.event ?? "";
  const cobrancaId = evento.payment?.id;
  const pedidoId = evento.payment?.externalReference;

  if (!cobrancaId) return NextResponse.json({ ok: true, ignorado: tipo });

  try {
    if (PAGOS.has(tipo)) {
      // Só muda pedido que ainda estava reservado. Se o Asaas reenviar o mesmo
      // aviso — e ele reenvia quando não recebe resposta —, a segunda vez não
      // encontra nada para alterar e nada acontece duas vezes.
      const r = await supabase(
        `/pedidos_loja?pagamento_id=eq.${encodeURIComponent(cobrancaId)}&status=eq.reservado`,
        {
          method: "PATCH",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify({ status: "pago", pago_em: new Date().toISOString() }),
        },
      );
      const alterados = await r.json();
      console.log(
        `[webhook] ${tipo} — pedido ${pedidoId ?? cobrancaId}: ${
          Array.isArray(alterados) && alterados.length ? "marcado como pago" : "já estava"
        }`,
      );
      return NextResponse.json({ ok: true });
    }

    if (DESFEITOS.has(tipo)) {
      // Devolver as peças é trabalho da função no banco, que também grava o
      // movimento de estoque. Precisa do número do pedido, não do da cobrança.
      if (!pedidoId || !dono) return NextResponse.json({ ok: true });

      await supabase("/rpc/cancelar_pedido", {
        method: "POST",
        body: JSON.stringify({ p_usuario: dono, p_id: pedidoId }),
      });
      console.log(`[webhook] ${tipo} — pedido ${pedidoId} cancelado, estoque devolvido.`);
      return NextResponse.json({ ok: true });
    }

    // Os demais eventos existem, mas não mudam nada aqui.
    return NextResponse.json({ ok: true, ignorado: tipo });
  } catch (e) {
    console.error("[webhook] Falhou ao processar:", e);
    // Devolver erro faz o Asaas tentar de novo mais tarde, que é o que
    // queremos quando o problema é nosso e passageiro.
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
