import { NextResponse } from "next/server";
import { bancoConfigurado, dono, insere } from "@/lib/admin";
import { avisaContato } from "@/lib/email";

/**
 * Formulário de contato e cadastro de novidades.
 *
 * Os dois caem aqui porque a diferença entre eles é pequena: um manda um
 * recado, o outro só deixa o e-mail. Ambos gravam em `mensagens_loja`, e só o
 * contato dispara aviso — ninguém quer um e-mail a cada assinatura.
 *
 * Antes, os dois trocavam de tela sem enviar nada.
 */

export const dynamic = "force-dynamic";

const texto = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);

// Não valida e-mail com regex gigante: só confere que tem uma arroba com algo
// dos dois lados. O resto quem decide é o servidor de e-mail.
const pareceEmail = (v: string) => /^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(v);

export async function POST(requisicao: Request) {
  let corpo: Record<string, unknown>;
  try {
    corpo = await requisicao.json();
  } catch {
    return NextResponse.json({ ok: false, recado: "Não entendi o envio." }, { status: 400 });
  }

  // Isca para robô: invisível na tela, então só quem não enxerga preenche.
  if (texto(corpo.site, 10)) return NextResponse.json({ ok: true });

  const tipo = corpo.tipo === "novidades" ? "novidades" : "contato";
  const email = texto(corpo.email, 160);
  const nome = texto(corpo.nome, 120);
  const mensagem = texto(corpo.mensagem, 4000);

  if (email && !pareceEmail(email)) {
    return NextResponse.json(
      { ok: false, recado: "Esse e-mail parece incompleto." },
      { status: 400 },
    );
  }

  if (tipo === "novidades" && !email) {
    return NextResponse.json(
      { ok: false, recado: "Preciso do seu e-mail." },
      { status: 400 },
    );
  }

  if (tipo === "contato" && (!nome || !mensagem)) {
    return NextResponse.json(
      { ok: false, recado: "Preencha seu nome e a mensagem." },
      { status: 400 },
    );
  }

  if (!bancoConfigurado) {
    console.error("[contato] Faltam as variáveis do Supabase.");
    return NextResponse.json(
      { ok: false, recado: "O formulário está fora do ar. Chame no WhatsApp." },
      { status: 503 },
    );
  }

  const linha = {
    usuario: dono,
    tipo,
    nome: nome || null,
    email: email || null,
    telefone: texto(corpo.telefone, 40) || null,
    assunto: texto(corpo.assunto, 160) || null,
    mensagem: mensagem || null,
  };

  const gravado = await insere<{ id: number }>("mensagens_loja", linha);

  if (!gravado.ok) {
    // Cadastrar de novo nas novidades não é erro para quem está do outro lado:
    // o e-mail já está na lista, que era o que a pessoa queria.
    const jaExiste = gravado.erro.includes("duplicate key");
    if (tipo === "novidades" && jaExiste) {
      return NextResponse.json({ ok: true, jaEstava: true });
    }

    return NextResponse.json(
      {
        ok: false,
        recado: "Não consegui enviar agora. Tente de novo ou chame no WhatsApp.",
      },
      { status: 502 },
    );
  }

  // Já está gravado: o aviso pode falhar sem levar a mensagem junto. Ainda
  // assim é esperado, não solto — a função serverless morre quando a resposta
  // sai, e o que ficou pendente morre com ela.
  if (tipo === "contato") {
    await avisaContato({
      nome,
      email,
      telefone: linha.telefone ?? undefined,
      assunto: linha.assunto ?? undefined,
      mensagem,
    }).catch(() => false);
  }

  return NextResponse.json({ ok: true });
}
