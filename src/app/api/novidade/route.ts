import { NextResponse } from "next/server";
import { bancoConfigurado, chaveServico, supabaseUrl } from "@/lib/admin";
import { avisaLancamento } from "@/lib/email";
import { siteUrl } from "@/lib/site";

/**
 * Aviso de produto novo para quem se cadastrou.
 *
 * Disparado por você, pelo botão no Precifica — nunca sozinho. Publicar é uma
 * coisa que você faz várias vezes por peça (ajusta preço, troca foto,
 * republica); se o e-mail saísse a cada publicação, a lista receberia a mesma
 * novidade cinco vezes e cancelaria a inscrição na terceira.
 *
 * Protegida pelo mesmo segredo do cron. Sem ele, qualquer pessoa poderia
 * mandar e-mail em nome da loja para a lista inteira.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const segredo = process.env.CRON_SECRET;

/** Lote por chamada. Acima disso a função estoura o tempo da hospedagem. */
const POR_VEZ = 200;

type Inscrito = { email: string; chave: string };

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

  let corpo: {
    slug?: unknown;
    nome?: unknown;
    descricao?: unknown;
    preco?: unknown;
    imagem?: unknown;
    /** Só conta quantas pessoas receberiam, sem enviar nada. */
    simular?: unknown;
  };
  try {
    corpo = await requisicao.json();
  } catch {
    return NextResponse.json({ ok: false, recado: "Não entendi." }, { status: 400 });
  }

  const slug = String(corpo.slug ?? "").trim();
  const nome = String(corpo.nome ?? "").trim();
  if (!slug || !nome) {
    return NextResponse.json(
      { ok: false, recado: "Preciso do produto." },
      { status: 400 },
    );
  }

  // Quem está na lista e ainda não saiu.
  const r = await fetch(
    `${supabaseUrl}/rest/v1/mensagens_loja?select=email,chave` +
      `&tipo=eq.novidades&saiu_em=is.null&email=not.is.null&limit=${POR_VEZ}`,
    {
      headers: {
        apikey: chaveServico as string,
        Authorization: `Bearer ${chaveServico}`,
      },
      cache: "no-store",
    },
  );

  if (!r.ok) {
    console.error(`[novidade] banco respondeu ${r.status}`);
    return NextResponse.json(
      { ok: false, recado: "Não consegui ler a lista." },
      { status: 502 },
    );
  }

  const inscritos = (await r.json()) as Inscrito[];

  // Modo conferência: o Precifica pergunta antes de mandar, para você ver
  // quantas pessoas vão receber e poder desistir.
  if (corpo.simular) {
    return NextResponse.json({ ok: true, quantos: inscritos.length, simulado: true });
  }

  const produto = {
    nome,
    descricao: String(corpo.descricao ?? "").trim().slice(0, 300) || undefined,
    preco: Number(corpo.preco) || undefined,
    imagem: corpo.imagem ? String(corpo.imagem) : null,
    url: `${siteUrl}/produto/${encodeURIComponent(slug)}`,
  };

  let enviados = 0;
  for (const i of inscritos) {
    if (!i.email || !i.chave) continue;
    const foi = await avisaLancamento(
      i.email,
      produto,
      `${siteUrl}/api/sair?c=${encodeURIComponent(i.chave)}`,
    ).catch(() => false);
    if (foi) enviados += 1;
  }

  console.log(`[novidade] ${slug}: ${enviados} de ${inscritos.length} enviados.`);
  return NextResponse.json({ ok: true, enviados, quantos: inscritos.length });
}
