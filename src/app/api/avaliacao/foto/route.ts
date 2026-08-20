import { NextResponse } from "next/server";
import { bancoConfigurado, chaveServico, dono, supabaseUrl } from "@/lib/admin";
import { pedidoPelaChave } from "@/lib/avaliacoes";

/**
 * Autoriza o cliente a subir uma foto junto com a avaliação.
 *
 * O arquivo não passa por aqui — só o pedido de permissão, igual ao envio de
 * orçamento. A diferença é o balde: este é público, porque a foto vai aparecer
 * na página do produto.
 *
 * Quem pode subir é quem tem a chave de um pedido de verdade. Sem essa
 * conferência, o balde viraria hospedagem de imagem aberta para qualquer um.
 */

export const dynamic = "force-dynamic";

const MAX_BYTES = 5 * 1024 * 1024;
const EXTENSOES = ["jpg", "jpeg", "png", "webp", "heic"];

/** Nome previsível: sem acento, sem espaço, sem subir de pasta. */
function nomeSeguro(nome: string) {
  return nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .slice(-60);
}

export async function POST(requisicao: Request) {
  if (!bancoConfigurado) {
    return NextResponse.json(
      { ok: false, recado: "O envio de fotos está fora do ar." },
      { status: 503 },
    );
  }

  let corpo: { chave?: unknown; nome?: unknown; tamanho?: unknown };
  try {
    corpo = await requisicao.json();
  } catch {
    return NextResponse.json({ ok: false, recado: "Não entendi." }, { status: 400 });
  }

  // A mesma porta da avaliação: sem pedido válido, sem upload.
  const pedido = await pedidoPelaChave(String(corpo.chave ?? "").trim());
  if (!pedido || (pedido.status !== "entregue" && pedido.status !== "pago")) {
    return NextResponse.json(
      { ok: false, recado: "Esse link de avaliação não vale mais." },
      { status: 404 },
    );
  }

  const nome = nomeSeguro(String(corpo.nome ?? "").trim());
  const tamanho = Number(corpo.tamanho) || 0;
  const extensao = nome.split(".").pop()?.toLowerCase() ?? "";

  if (!nome || !EXTENSOES.includes(extensao)) {
    return NextResponse.json(
      { ok: false, recado: "Mande uma foto em JPG, PNG ou WEBP." },
      { status: 400 },
    );
  }
  if (tamanho <= 0 || tamanho > MAX_BYTES) {
    return NextResponse.json(
      { ok: false, recado: "A foto pode ter até 5 MB." },
      { status: 400 },
    );
  }

  // O caminho é montado aqui, nunca recebido pronto: senão daria para
  // escrever por cima de qualquer arquivo do balde.
  const caminho = `${dono}/avaliacoes/${pedido.id}/${Date.now()}-${nome}`;

  try {
    const r = await fetch(
      `${supabaseUrl}/storage/v1/object/upload/sign/avaliacoes/${caminho}`,
      {
        method: "POST",
        headers: {
          apikey: chaveServico as string,
          Authorization: `Bearer ${chaveServico}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({ expiresIn: 600 }),
        signal: AbortSignal.timeout(10000),
      },
    );

    if (!r.ok) {
      console.error(`[avaliacao/foto] storage recusou (${r.status}): ${await r.text()}`);
      return NextResponse.json(
        { ok: false, recado: "Não consegui liberar o envio da foto." },
        { status: 502 },
      );
    }

    const { url } = (await r.json()) as { url: string };
    return NextResponse.json({
      ok: true,
      url: `${supabaseUrl}/storage/v1${url}`,
      caminho,
      // Endereço final, já público, para gravar na avaliação.
      publica: `${supabaseUrl}/storage/v1/object/public/avaliacoes/${caminho}`,
    });
  } catch (e) {
    console.error("[avaliacao/foto] falhou:", e);
    return NextResponse.json(
      { ok: false, recado: "Não consegui liberar o envio da foto." },
      { status: 502 },
    );
  }
}
