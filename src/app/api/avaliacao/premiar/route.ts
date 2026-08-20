import { NextResponse } from "next/server";
import { bancoConfigurado, chaveServico, dono, insere, supabaseUrl } from "@/lib/admin";
import { agradeceAFoto } from "@/lib/email";
import { site } from "@/lib/site";

/**
 * Cupom de agradecimento por avaliação com foto.
 *
 * Chamado pelo Precifica no momento em que você aprova a avaliação — que é o
 * mesmo momento em que você olhou a foto e decidiu que ela é da peça mesmo.
 * Premiar no envio seria premiar antes de conferir.
 *
 * O código é único e de uso único: um cupom compartilhado vazaria em minutos
 * num grupo de WhatsApp, e viraria desconto para todo mundo.
 */

export const dynamic = "force-dynamic";

const segredo = process.env.CRON_SECRET;

type Avaliacao = {
  id: number;
  slug: string;
  pedido_id: string;
  nome: string;
  aprovada: boolean;
  cupom: string | null;
  fotos: { url: string }[] | null;
};

function cabecalhos() {
  return {
    apikey: chaveServico as string,
    Authorization: `Bearer ${chaveServico}`,
    "Content-Type": "application/json",
  };
}

/** Código curto, fácil de digitar e difícil de confundir. */
function novoCodigo() {
  // Sem I, O, 0 e 1: no papel e na tela, uma vira a outra.
  const alfabeto = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 5; i++) {
    s += alfabeto[Math.floor(Math.random() * alfabeto.length)];
  }
  return `FOTO${s}`;
}

export async function POST(requisicao: Request) {
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

  const id = Number(corpo.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ ok: false, recado: "Falta a avaliação." }, { status: 400 });
  }

  try {
    // 1. A avaliação
    const rAval = await fetch(
      `${supabaseUrl}/rest/v1/avaliacoes?select=id,slug,pedido_id,nome,aprovada,cupom,fotos&id=eq.${id}&limit=1`,
      { headers: cabecalhos(), cache: "no-store" },
    );
    const avals = rAval.ok ? ((await rAval.json()) as Avaliacao[]) : [];
    const aval = avals[0];

    if (!aval) {
      return NextResponse.json({ ok: false, recado: "Avaliação não encontrada." }, { status: 404 });
    }
    if (!aval.fotos?.length) {
      return NextResponse.json({ ok: false, motivo: "sem_foto" });
    }
    // Aprovar, tirar do ar e aprovar de novo não gera um segundo cupom.
    if (aval.cupom) {
      return NextResponse.json({ ok: true, jaTinha: true, codigo: aval.cupom });
    }

    // 2. O e-mail de quem avaliou vem do pedido
    const rPedido = await fetch(
      `${supabaseUrl}/rest/v1/pedidos_loja?select=cliente&id=eq.${encodeURIComponent(aval.pedido_id)}&limit=1`,
      { headers: cabecalhos(), cache: "no-store" },
    );
    const pedidos = rPedido.ok
      ? ((await rPedido.json()) as { cliente?: Record<string, string> }[])
      : [];
    const email = pedidos[0]?.cliente?.email;

    if (!email) {
      return NextResponse.json({ ok: false, motivo: "sem_email" });
    }

    // 3. O cupom
    const { percentual, validadeDias, minimo } = site.premioPorFoto;
    const vence = new Date();
    vence.setDate(vence.getDate() + validadeDias);
    // Duas tentativas: o código é sorteado, e dois sorteios iguais fariam o
    // insert bater na chave primária. É raro, mas falhar por azar seria bobo.
    let codigo = "";
    let criado: Awaited<ReturnType<typeof insere>> | null = null;

    for (let tentativa = 0; tentativa < 2; tentativa += 1) {
      codigo = novoCodigo();
      criado = await insere("cupons", {
        usuario: dono,
        codigo,
        tipo: "percentual",
        valor: percentual,
        minimo,
        ativo: true,
        expira_em: vence.toISOString().slice(0, 10),
        // Uso único: cupom que roda solto num grupo vira desconto para todos.
        usos_max: 1,
        descricao: `Agradecimento por foto na avaliação (pedido ${aval.pedido_id})`,
      });
      if (criado.ok || !criado.erro.includes("duplicate key")) break;
    }

    if (!criado || !criado.ok) {
      console.error(`[premiar] não criei o cupom: ${criado?.erro}`);
      return NextResponse.json(
        { ok: false, recado: "Não consegui criar o cupom." },
        { status: 502 },
      );
    }

    // 4. Guarda na avaliação antes de avisar: se o e-mail falhar, o cupom
    //    existe e você consegue passar o código por WhatsApp.
    await fetch(`${supabaseUrl}/rest/v1/avaliacoes?id=eq.${id}`, {
      method: "PATCH",
      headers: { ...cabecalhos(), Prefer: "return=minimal" },
      cache: "no-store",
      body: JSON.stringify({ cupom: codigo }),
    });

    const avisado = await agradeceAFoto({
      email,
      nome: aval.nome,
      codigo,
      percentual,
      validadeDias,
    }).catch(() => false);

    return NextResponse.json({ ok: true, codigo, avisado });
  } catch (e) {
    console.error("[premiar] falhou:", e);
    return NextResponse.json(
      { ok: false, recado: "Não consegui gerar o cupom agora." },
      { status: 502 },
    );
  }
}
