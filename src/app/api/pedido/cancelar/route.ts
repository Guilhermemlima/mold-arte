import { NextResponse } from "next/server";
import { cabecalhosCors, comCors } from "@/lib/cors";
import { bancoConfigurado, chaveServico, dono, supabaseUrl } from "@/lib/admin";
import { cancelarCobranca } from "@/lib/asaas";

/**
 * Cancelamento de pedido, chamado pelo Precifica.
 *
 * Antes o Precifica cancelava direto no banco: as peças voltavam ao estoque e
 * pronto. Só que a cobrança continuava viva no Asaas — o cliente ainda podia
 * pagar um pedido já desfeito, e você tinha que lembrar de cancelar nos dois
 * lugares. Esta rota faz as duas coisas na ordem certa.
 *
 * Protegida pelo mesmo segredo do cron: só o Precifica chama.
 */

export const dynamic = "force-dynamic";

/**
 * Permissão para o Precifica chamar daqui de fora.
 *
 * Ele roda num endereço próprio, então toda chamada é entre origens
 * diferentes — e como ela leva o cabeçalho do segredo, o navegador pergunta
 * antes se pode. Sem esta resposta a requisição nem sai, e do outro lado
 * parece que a loja está fora do ar.
 */
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: cabecalhosCors });
}

export async function POST(requisicao: Request) {
  // Um ponto só para carimbar CORS, em vez de lembrar disso em cada resposta.
  return comCors(await responde(requisicao));
}

const segredo = process.env.CRON_SECRET;

async function responde(requisicao: Request) {
  if (!segredo) {
    return NextResponse.json(
      { ok: false, recado: "Falta a variável CRON_SECRET na Vercel." },
      { status: 503 },
    );
  }
  if (requisicao.headers.get("x-cron-secret") !== segredo) {
    return NextResponse.json({ ok: false, recado: "segredo inválido" }, { status: 401 });
  }
  if (!bancoConfigurado) {
    return NextResponse.json({ ok: false, recado: "banco não configurado" }, { status: 503 });
  }

  let corpo: { id?: unknown };
  try {
    corpo = await requisicao.json();
  } catch {
    return NextResponse.json({ ok: false, recado: "Não entendi." }, { status: 400 });
  }

  const id = String(corpo.id ?? "").trim();
  if (!id) {
    return NextResponse.json({ ok: false, recado: "Falta o pedido." }, { status: 400 });
  }

  const cabecalhos = {
    apikey: chaveServico as string,
    Authorization: `Bearer ${chaveServico}`,
    "Content-Type": "application/json",
  };

  try {
    // Descobre a cobrança antes de cancelar: depois do cancelamento o pedido
    // ainda guarda o id, mas é melhor ler enquanto está tudo intacto.
    const busca = await fetch(
      `${supabaseUrl}/rest/v1/pedidos_loja?select=pagamento_id,status&id=eq.${encodeURIComponent(id)}&limit=1`,
      { headers: cabecalhos, cache: "no-store" },
    );
    const linhas = busca.ok ? ((await busca.json()) as { pagamento_id?: string; status?: string }[]) : [];
    const cobrancaId = linhas[0]?.pagamento_id;

    // O estoque volta pela função do banco, que também grava o movimento.
    const devolucao = await fetch(`${supabaseUrl}/rest/v1/rpc/cancelar_pedido`, {
      method: "POST",
      headers: cabecalhos,
      cache: "no-store",
      body: JSON.stringify({ p_usuario: dono, p_id: id }),
    });

    if (!devolucao.ok) {
      console.error(`[cancelar] banco recusou (${devolucao.status}): ${await devolucao.text()}`);
      return NextResponse.json(
        { ok: false, recado: "Não consegui cancelar o pedido no banco." },
        { status: 502 },
      );
    }

    // A cobrança é o segundo passo de propósito. Se ela falhar, o pedido já
    // está cancelado e o estoque já voltou — o que sobra é uma cobrança para
    // apagar na mão, e a resposta diz isso.
    let cobranca: string | null = null;
    if (cobrancaId) {
      const r = await cancelarCobranca(cobrancaId);
      if (!r.ok) {
        console.warn(`[cancelar] ${id}: cobrança não cancelada — ${r.erro}`);
        cobranca = r.erro;
      }
    }

    return NextResponse.json({
      ok: true,
      pedidoCancelado: true,
      cobrancaCancelada: Boolean(cobrancaId) && !cobranca,
      tinhaCobranca: Boolean(cobrancaId),
      avisoDaCobranca: cobranca,
    });
  } catch (e) {
    console.error("[cancelar] falhou:", e);
    return NextResponse.json(
      { ok: false, recado: "Não consegui cancelar agora." },
      { status: 502 },
    );
  }
}
