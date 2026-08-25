import { NextResponse } from "next/server";

/**
 * Confere um cupom antes de fechar o pedido.
 *
 * Serve só para o cliente ver o efeito na tela. Quem decide de verdade é o
 * banco, na hora de criar o pedido, com o subtotal que ele mesmo calcula a
 * partir dos preços publicados — então mentir aqui não gera desconto nenhum.
 */

export const dynamic = "force-dynamic";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const dono = process.env.NEXT_PUBLIC_SUPABASE_OWNER;

export async function POST(requisicao: Request) {
  if (!url || !anon || !dono) {
    return NextResponse.json(
      { ok: false, recado: "A loja está sem conexão para conferir cupons." },
      { status: 503 },
    );
  }

  let corpo: { codigo?: unknown; subtotal?: unknown; email?: unknown };
  try {
    corpo = await requisicao.json();
  } catch {
    return NextResponse.json({ ok: false, recado: "Não entendi." }, { status: 400 });
  }

  const codigo = String(corpo.codigo ?? "").trim();
  const subtotal = Number(corpo.subtotal) || 0;
  // Cupom pode ser pessoal. Quem confere é o banco; daqui vai só quem a pessoa
  // diz ser. No carrinho, antes de ela preencher os dados, isto chega vazio —
  // e aí a resposta é "preencha seu e-mail", não "não vale".
  const email = String(corpo.email ?? "").trim();

  if (!codigo) {
    return NextResponse.json({ ok: false, recado: "Digite um cupom." });
  }

  function pergunta(args: Record<string, unknown>) {
    return fetch(`${url}/rest/v1/rpc/valida_cupom`, {
      method: "POST",
      headers: {
        apikey: anon as string,
        Authorization: `Bearer ${anon}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
      body: JSON.stringify(args),
    });
  }

  try {
    let r = await pergunta({
      p_usuario: dono,
      p_codigo: codigo,
      p_subtotal: subtotal,
      p_email: email || null,
    });

    // O banco acha a função pelo nome dos argumentos. Enquanto o
    // supabase-clientes.sql não for rodado, a versão de lá não conhece
    // p_email e responde 404 — e aí nenhum cupom passaria na tela, nem os
    // comuns. Neste caso a pergunta é refeita sem o e-mail: cupom pessoal
    // ainda não existe no banco antigo, então não há o que conferir.
    if (r.status === 404) {
      console.error("[cupom] O banco não conhece p_email — rode o supabase-clientes.sql.");
      r = await pergunta({ p_usuario: dono, p_codigo: codigo, p_subtotal: subtotal });
    }

    if (!r.ok) {
      const texto = await r.text();
      console.error(`[cupom] O banco respondeu ${r.status}: ${texto}`);
      return NextResponse.json(
        {
          ok: false,
          recado:
            r.status === 404
              ? "Cupons ainda não foram ativados nesta loja."
              : "Não consegui conferir o cupom agora.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json(await r.json());
  } catch (e) {
    console.error("[cupom] Falhou:", e);
    return NextResponse.json(
      { ok: false, recado: "Não consegui conferir o cupom agora." },
      { status: 502 },
    );
  }
}
