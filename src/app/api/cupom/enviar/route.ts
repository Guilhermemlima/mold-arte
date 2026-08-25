import { NextResponse } from "next/server";
import { cabecalhosCors, comCors } from "@/lib/cors";
import { bancoConfigurado, chaveServico, dono, supabaseUrl } from "@/lib/admin";
import { entregaCupom } from "@/lib/email";

/**
 * Manda por e-mail um cupom que você acabou de criar na aba Clientes.
 *
 * Chamado pelo Precifica. O que chega do outro lado é só o código: quem diz o
 * que o cupom faz é o banco. Se a rota confiasse no corpo da chamada, o e-mail
 * poderia anunciar 50% enquanto o cupom vale 10 — e quem descobriria seria o
 * cliente, na hora de fechar o pedido.
 *
 * Protegida pelo mesmo segredo do cron.
 */

export const dynamic = "force-dynamic";

/** Permissão para o Precifica chamar daqui de fora (ele roda noutro endereço). */
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: cabecalhosCors });
}

export async function POST(requisicao: Request) {
  return comCors(await responde(requisicao));
}

const segredo = process.env.CRON_SECRET;

type Cupom = {
  codigo: string;
  tipo: string;
  valor: number | string;
  minimo: number | string;
  ativo: boolean;
  expira_em: string | null;
  email: string | null;
  descricao: string | null;
};

/** A mesma frase que aparece na tela do Precifica, escrita uma vez só. */
function oQueOCupomFaz(c: Cupom) {
  const valor = Number(c.valor) || 0;
  if (c.tipo === "frete") return "frete grátis";
  if (c.tipo === "percentual") return `${valor.toFixed(0)}% de desconto`;
  return `${valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} de desconto`;
}

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

  let corpo: { codigo?: unknown; nome?: unknown; motivo?: unknown };
  try {
    corpo = await requisicao.json();
  } catch {
    return NextResponse.json({ ok: false, recado: "Não entendi." }, { status: 400 });
  }

  const codigo = String(corpo.codigo ?? "").trim().toUpperCase();
  if (!codigo) {
    return NextResponse.json({ ok: false, recado: "Falta o cupom." }, { status: 400 });
  }

  try {
    const r = await fetch(
      `${supabaseUrl}/rest/v1/cupons?select=codigo,tipo,valor,minimo,ativo,expira_em,email,descricao` +
        `&usuario=eq.${encodeURIComponent(dono as string)}` +
        `&codigo=eq.${encodeURIComponent(codigo)}&limit=1`,
      {
        headers: {
          apikey: chaveServico as string,
          Authorization: `Bearer ${chaveServico}`,
        },
        cache: "no-store",
      },
    );

    const cupons = r.ok ? ((await r.json()) as Cupom[]) : [];
    const cupom = cupons[0];

    if (!cupom) {
      return NextResponse.json(
        { ok: false, recado: "Esse cupom não existe no banco." },
        { status: 404 },
      );
    }

    // Sem e-mail no cupom não há para onde mandar — e um cupom sem dono não
    // deveria virar mensagem pessoal: ele vale para qualquer um que receba.
    if (!cupom.email) {
      return NextResponse.json(
        {
          ok: false,
          recado: "Esse cupom não está no nome de ninguém, então não tem destinatário.",
        },
        { status: 409 },
      );
    }

    if (!cupom.ativo) {
      return NextResponse.json(
        { ok: false, recado: "Esse cupom está desligado — ligue antes de enviar." },
        { status: 409 },
      );
    }

    const enviado = await entregaCupom({
      email: cupom.email,
      nome: String(corpo.nome ?? "").trim() || cupom.email.split("@")[0],
      codigo: cupom.codigo.toUpperCase(),
      oQueFaz: oQueOCupomFaz(cupom),
      validoAte: cupom.expira_em
        ? new Date(`${cupom.expira_em}T12:00:00`).toLocaleDateString("pt-BR")
        : null,
      minimo: Number(cupom.minimo) || 0,
      motivo: String(corpo.motivo ?? "").trim() || cupom.descricao,
    }).catch(() => false);

    if (!enviado) {
      return NextResponse.json(
        {
          ok: false,
          recado:
            "O cupom existe, mas o e-mail não saiu. Passe o código por WhatsApp — ele já está valendo.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true, para: cupom.email });
  } catch (e) {
    console.error("[cupom/enviar] falhou:", e);
    return NextResponse.json(
      { ok: false, recado: "Não consegui enviar agora." },
      { status: 502 },
    );
  }
}
