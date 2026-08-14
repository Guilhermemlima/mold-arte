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

  let corpo: { codigo?: unknown; subtotal?: unknown };
  try {
    corpo = await requisicao.json();
  } catch {
    return NextResponse.json({ ok: false, recado: "Não entendi." }, { status: 400 });
  }

  const codigo = String(corpo.codigo ?? "").trim();
  const subtotal = Number(corpo.subtotal) || 0;

  if (!codigo) {
    return NextResponse.json({ ok: false, recado: "Digite um cupom." });
  }

  try {
    const r = await fetch(`${url}/rest/v1/rpc/valida_cupom`, {
      method: "POST",
      headers: {
        apikey: anon,
        Authorization: `Bearer ${anon}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
      body: JSON.stringify({
        p_usuario: dono,
        p_codigo: codigo,
        p_subtotal: subtotal,
      }),
    });

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
