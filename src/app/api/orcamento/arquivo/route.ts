import { NextResponse } from "next/server";
import { autorizaUpload, bancoConfigurado } from "@/lib/admin";

/**
 * Autoriza o navegador a subir um arquivo de orçamento.
 *
 * O arquivo não passa por aqui — só o pedido de permissão. Ver o porquê em
 * `autorizaUpload`: a Vercel não deixa passar corpo grande, e um STL de peça
 * grande passa fácil do limite.
 *
 * Como a permissão é dada antes de o arquivo existir, a checagem do que pode
 * subir acontece toda neste ponto: extensão, tamanho e quantidade. O caminho é
 * montado aqui também, nunca recebido pronto — senão daria para escrever por
 * cima de qualquer arquivo do balde só mandando o caminho dele.
 */

export const dynamic = "force-dynamic";

const MAX_BYTES = 50 * 1024 * 1024;

// Modelos 3D e os anexos de referência que costumam vir junto. Nada
// executável: quem abre esses arquivos depois é você, na sua máquina.
const EXTENSOES = [
  "stl", "obj", "3mf", "step", "stp", "gcode",
  "pdf", "png", "jpg", "jpeg", "webp", "zip",
  // Logo de empresa quase nunca vem em PNG: vem no vetor que a agência
  // entregou. Recusar esses formatos faria o pedido de brinde travar logo
  // no anexo, que é onde ele tem mais chance de ser abandonado.
  "svg", "ai", "eps", "cdr", "dxf",
];

/** Nome de arquivo previsível: sem acento, sem espaço, sem subir de pasta. */
function nomeSeguro(nome: string) {
  return nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .slice(-80);
}

export async function POST(requisicao: Request) {
  if (!bancoConfigurado) {
    return NextResponse.json(
      { ok: false, recado: "O envio de arquivos está fora do ar." },
      { status: 503 },
    );
  }

  let corpo: { nome?: unknown; tamanho?: unknown; pasta?: unknown };
  try {
    corpo = await requisicao.json();
  } catch {
    return NextResponse.json({ ok: false, recado: "Não entendi." }, { status: 400 });
  }

  const nome = nomeSeguro(String(corpo.nome ?? "").trim());
  const tamanho = Number(corpo.tamanho) || 0;
  const extensao = nome.split(".").pop()?.toLowerCase() ?? "";

  if (!nome || !EXTENSOES.includes(extensao)) {
    return NextResponse.json(
      {
        ok: false,
        recado: `Esse tipo de arquivo não é aceito. Mande ${EXTENSOES.slice(0, 6).join(", ")} ou uma imagem.`,
      },
      { status: 400 },
    );
  }

  if (tamanho <= 0 || tamanho > MAX_BYTES) {
    return NextResponse.json(
      { ok: false, recado: "O limite é 50 MB por arquivo." },
      { status: 400 },
    );
  }

  // A pasta vem do rascunho do formulário só para agrupar os arquivos de um
  // mesmo envio. Se vier qualquer coisa esquisita, uma nova é sorteada aqui.
  const pasta = /^[a-z0-9]{6,24}$/i.test(String(corpo.pasta ?? ""))
    ? String(corpo.pasta)
    : Math.random().toString(36).slice(2, 12);

  const caminho = `${process.env.NEXT_PUBLIC_SUPABASE_OWNER}/orcamentos/${pasta}/${Date.now()}-${nome}`;

  const permissao = await autorizaUpload(caminho);
  if (!permissao.ok) {
    return NextResponse.json({ ok: false, recado: permissao.erro }, { status: 502 });
  }

  return NextResponse.json({ ok: true, url: permissao.url, caminho, pasta });
}
