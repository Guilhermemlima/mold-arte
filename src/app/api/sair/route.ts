import { NextResponse } from "next/server";
import { bancoConfigurado, chaveServico, supabaseUrl } from "@/lib/admin";
import { siteUrl } from "@/lib/site";

/**
 * Saída da lista de novidades.
 *
 * Um clique no rodapé do e-mail e pronto: sem login, sem formulário, sem
 * "tem certeza?" três vezes. Quem entrou numa lista precisa conseguir sair
 * sozinho — e dificultar isso só transforma cancelamento em denúncia de spam,
 * que estraga a entrega de todos os outros e-mails da loja.
 *
 * É GET porque quem chega vem de um link clicado no e-mail.
 */

export const dynamic = "force-dynamic";

export async function GET(requisicao: Request) {
  const chave = new URL(requisicao.url).searchParams.get("c") ?? "";
  const destino = new URL("/novidades/saiu", siteUrl);

  if (!bancoConfigurado || !/^[a-f0-9]{16,64}$/i.test(chave)) {
    destino.searchParams.set("erro", "1");
    return NextResponse.redirect(destino);
  }

  try {
    // Marca a data em vez de apagar a linha: assim dá para saber que a pessoa
    // saiu, e um novo cadastro com o mesmo e-mail não esbarra no índice único.
    const r = await fetch(
      `${supabaseUrl}/rest/v1/mensagens_loja?chave=eq.${encodeURIComponent(chave)}&saiu_em=is.null`,
      {
        method: "PATCH",
        headers: {
          apikey: chaveServico as string,
          Authorization: `Bearer ${chaveServico}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        cache: "no-store",
        body: JSON.stringify({ saiu_em: new Date().toISOString() }),
      },
    );
    // Chave que não existe, ou pessoa que já tinha saído, chega na mesma tela:
    // do lado de fora o resultado é o mesmo — ela não recebe mais.
    if (!r.ok) console.error(`[sair] banco respondeu ${r.status}`);
  } catch (e) {
    console.error("[sair] falhou:", e);
    destino.searchParams.set("erro", "1");
  }

  return NextResponse.redirect(destino);
}
