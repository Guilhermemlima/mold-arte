import { NextResponse } from "next/server";
import { bancoConfigurado, chaveServico, dono, supabaseUrl } from "@/lib/admin";

/**
 * Consulta do pedido pelo cliente.
 *
 * Sem login de propósito: ninguém cria conta para saber se a peça já saiu. O
 * que substitui a senha é exigir **duas** informações que só quem comprou tem
 * — o número do pedido e o e-mail usado na compra. O número sozinho não abre
 * nada; se abrisse, bastaria tentar em sequência para ler o pedido alheio.
 *
 * Quem decide o que sai daqui é a função no banco, que devolve status, itens e
 * rastreio — nunca CPF, telefone ou endereço completo.
 */

export const dynamic = "force-dynamic";

/** Espera um instante a cada tentativa, para desencorajar quem fica chutando. */
const ESPERA_MS = 400;

export async function POST(requisicao: Request) {
  if (!bancoConfigurado) {
    return NextResponse.json(
      { ok: false, recado: "A consulta está fora do ar. Chame a gente no WhatsApp." },
      { status: 503 },
    );
  }

  let corpo: { id?: unknown; email?: unknown };
  try {
    corpo = await requisicao.json();
  } catch {
    return NextResponse.json({ ok: false, recado: "Não entendi." }, { status: 400 });
  }

  const id = String(corpo.id ?? "").trim().slice(0, 40);
  const email = String(corpo.email ?? "").trim().slice(0, 160);

  if (!id || !email) {
    return NextResponse.json(
      { ok: false, recado: "Preencha o número do pedido e o e-mail da compra." },
      { status: 400 },
    );
  }

  await new Promise((r) => setTimeout(r, ESPERA_MS));

  try {
    const r = await fetch(`${supabaseUrl}/rest/v1/rpc/consultar_pedido`, {
      method: "POST",
      headers: {
        apikey: chaveServico as string,
        Authorization: `Bearer ${chaveServico}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
      body: JSON.stringify({ p_usuario: dono, p_id: id, p_email: email }),
    });

    if (!r.ok) {
      console.error(`[consulta] banco respondeu ${r.status}: ${await r.text()}`);
      return NextResponse.json(
        { ok: false, recado: "Não consegui consultar agora. Tente de novo." },
        { status: 502 },
      );
    }

    const dados = await r.json();

    if (!dados?.ok) {
      // A mesma resposta para número errado e e-mail errado. Dizer qual dos
      // dois falhou entregaria de graça que aquele número existe.
      return NextResponse.json(
        {
          ok: false,
          recado:
            "Não achei esse pedido. Confira o número e o e-mail — precisam ser " +
            "os mesmos da compra.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json(dados);
  } catch (e) {
    console.error("[consulta] falhou:", e);
    return NextResponse.json(
      { ok: false, recado: "Não consegui consultar agora. Tente de novo." },
      { status: 502 },
    );
  }
}
