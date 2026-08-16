import { NextResponse } from "next/server";
import { bancoConfigurado, chaveServico, supabaseUrl } from "@/lib/admin";
import { avisaEnvio, convidaParaAvaliar, lembraDoPagamento } from "@/lib/email";
import { siteUrl } from "@/lib/site";

/**
 * Tarefas de tempo: os e-mails que não nascem de um clique.
 *
 * Chamada de fora, de tempos em tempos (o agendador está no próprio Supabase,
 * em `supabase-cron.sql`). Duas coisas acontecem aqui:
 *
 * - **lembrete**: pedido feito há mais de uma hora e ainda sem pagamento
 *   recebe um e-mail com o link. É a única mensagem automática de cobrança —
 *   uma, e só uma;
 * - **convite para avaliar**: pedido marcado como entregue no Precifica recebe
 *   o convite depois de dois dias, tempo de a peça chegar e ser usada.
 *
 * A proteção é um segredo no cabeçalho. Sem ele, qualquer pessoa poderia
 * chamar esta rota em sequência e fazer o site disparar e-mail sem parar.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const segredo = process.env.CRON_SECRET;

/** Uma hora é tempo de a pessoa ter desistido, não de ainda estar digitando. */
const HORAS_ATE_LEMBRAR = 1;
/** Dois dias depois da entrega: a peça chegou e já foi usada. */
const DIAS_ATE_CONVIDAR = 2;

type PedidoNoBanco = {
  id: string;
  chave: string | null;
  itens?: { nome?: string; quantidade?: number; total?: number; tamanho?: string | null }[];
  subtotal?: number | string;
  frete?: number | string;
  total?: number | string;
  cliente?: Record<string, string>;
  entrega?: Record<string, string>;
  pagamento_url?: string | null;
};

function supabase(caminho: string, opcoes: RequestInit = {}) {
  return fetch(`${supabaseUrl}/rest/v1${caminho}`, {
    ...opcoes,
    headers: {
      apikey: chaveServico as string,
      Authorization: `Bearer ${chaveServico}`,
      "Content-Type": "application/json",
      ...(opcoes.headers ?? {}),
    },
    cache: "no-store",
  });
}

function paraEmail(p: PedidoNoBanco) {
  return {
    id: p.id,
    itens: p.itens ?? [],
    subtotal: Number(p.subtotal ?? 0),
    frete: Number(p.frete ?? 0),
    total: Number(p.total ?? 0),
    cliente: p.cliente ?? {},
    entrega: p.entrega ?? {},
  };
}

/** Marca a data de envio para o próximo giro não repetir a mensagem. */
function marca(id: string, coluna: "lembrete_em" | "convite_aval_em") {
  return supabase(`/pedidos_loja?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ [coluna]: new Date().toISOString() }),
  });
}

async function lembretes() {
  const limite = new Date(Date.now() - HORAS_ATE_LEMBRAR * 3600_000).toISOString();

  // Só pedido ainda reservado, criado há mais de uma hora, que nunca recebeu
  // lembrete. Quem já pagou, cancelou ou expirou fica de fora.
  const r = await supabase(
    "/pedidos_loja?select=*&status=eq.reservado&lembrete_em=is.null" +
      `&criado_em=lt.${encodeURIComponent(limite)}&limit=40`,
  );
  if (!r.ok) {
    console.error(`[cron] lembretes: banco respondeu ${r.status}`);
    return { enviados: 0, erros: 1 };
  }

  const pedidos = (await r.json()) as PedidoNoBanco[];
  let enviados = 0;

  for (const p of pedidos) {
    const foi = await lembraDoPagamento({
      ...paraEmail(p),
      pagamentoUrl: p.pagamento_url ?? null,
    }).catch(() => false);

    // Marca mesmo quando o e-mail não sai. Sem endereço, ou com endereço
    // errado, tentar de novo a cada quinze minutos não conserta nada — só
    // gasta a cota do Resend e enche o log.
    await marca(p.id, "lembrete_em");
    if (foi) enviados += 1;
  }

  return { enviados, total: pedidos.length, erros: 0 };
}

async function convites() {
  const limite = new Date(Date.now() - DIAS_ATE_CONVIDAR * 86_400_000).toISOString();

  const r = await supabase(
    "/pedidos_loja?select=*&status=eq.entregue&convite_aval_em=is.null" +
      `&criado_em=lt.${encodeURIComponent(limite)}&limit=40`,
  );
  if (!r.ok) {
    console.error(`[cron] convites: banco respondeu ${r.status}`);
    return { enviados: 0, erros: 1 };
  }

  const pedidos = (await r.json()) as PedidoNoBanco[];
  let enviados = 0;

  for (const p of pedidos) {
    // Sem chave não há como abrir a página de avaliação sem login, então o
    // convite não tem para onde apontar.
    if (!p.chave) {
      await marca(p.id, "convite_aval_em");
      continue;
    }

    const foi = await convidaParaAvaliar({
      ...paraEmail(p),
      linkAvaliacao: `${siteUrl}/avaliar/${p.chave}`,
    }).catch(() => false);

    await marca(p.id, "convite_aval_em");
    if (foi) enviados += 1;
  }

  return { enviados, total: pedidos.length, erros: 0 };
}

/**
 * Avisa quem teve o pedido despachado.
 *
 * O gatilho é você colar o código de rastreio no Precifica. Podia ser o
 * próprio Precifica a chamar o site, mas assim o aviso sai mesmo se você
 * estiver sem internet na hora de colar — o código fica gravado e o próximo
 * giro leva o recado.
 */
async function avisosDeEnvio() {
  const r = await supabase(
    "/pedidos_loja?select=*&rastreio=not.is.null&aviso_envio_em=is.null&limit=40",
  );
  if (!r.ok) {
    console.error(`[cron] avisos de envio: banco respondeu ${r.status}`);
    return { enviados: 0, erros: 1 };
  }

  const pedidos = (await r.json()) as (PedidoNoBanco & { rastreio?: string })[];
  let enviados = 0;

  for (const p of pedidos) {
    const foi = await avisaEnvio({
      ...paraEmail(p),
      rastreio: p.rastreio as string,
    }).catch(() => false);

    await supabase(`/pedidos_loja?id=eq.${encodeURIComponent(p.id)}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ aviso_envio_em: new Date().toISOString() }),
    });
    if (foi) enviados += 1;
  }

  return { enviados, total: pedidos.length, erros: 0 };
}

export async function POST(requisicao: Request) {
  if (!segredo) {
    console.error("[cron] CRON_SECRET não configurado — rota desligada.");
    return NextResponse.json(
      {
        ok: false,
        recado:
          "Falta a variável CRON_SECRET. Enquanto ela não existir, nenhum " +
          "lembrete nem convite de avaliação é enviado.",
      },
      { status: 503 },
    );
  }

  if (requisicao.headers.get("x-cron-secret") !== segredo) {
    return NextResponse.json({ ok: false, recado: "segredo inválido" }, { status: 401 });
  }

  if (!bancoConfigurado) {
    return NextResponse.json({ ok: false, recado: "banco não configurado" }, { status: 503 });
  }

  const [lembrete, convite, envio] = await Promise.all([
    lembretes(),
    convites(),
    avisosDeEnvio(),
  ]);
  console.log("[cron]", JSON.stringify({ lembrete, convite, envio }));

  return NextResponse.json({ ok: true, lembrete, convite, envio });
}
