import "server-only";
import { bancoConfigurado, chaveServico, supabaseUrl } from "./admin";

/**
 * Leitura dos pedidos pela chave, e das avaliações já aprovadas.
 *
 * A chave é sorteada quando o pedido nasce e sai só no e-mail. É ela que
 * substitui o login: quem tem o link avalia, quem não tem não chega. O número
 * do pedido sozinho não serve — se servisse, bastaria tentar em sequência.
 */

export type PedidoNoBanco = {
  id: string;
  status: string;
  cliente?: Record<string, string>;
  itens?: { slug?: string; nome?: string; tamanho?: string | null }[];
};

export async function pedidoPelaChave(chave: string): Promise<PedidoNoBanco | null> {
  if (!bancoConfigurado || !/^[a-f0-9]{16,64}$/i.test(chave)) return null;

  try {
    const r = await fetch(
      `${supabaseUrl}/rest/v1/pedidos_loja?select=id,status,cliente,itens` +
        `&chave=eq.${encodeURIComponent(chave)}&limit=1`,
      {
        headers: {
          apikey: chaveServico as string,
          Authorization: `Bearer ${chaveServico}`,
        },
        cache: "no-store",
      },
    );
    if (!r.ok) return null;
    const linhas = (await r.json()) as PedidoNoBanco[];
    return linhas[0] ?? null;
  } catch {
    return null;
  }
}

export type Avaliacao = {
  nome: string;
  nota: number;
  comentario: string | null;
  criado_em: string;
};

/** As avaliações aprovadas de um produto, para a página dele. */
export async function avaliacoesDoProduto(slug: string): Promise<Avaliacao[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return [];

  try {
    const r = await fetch(
      `${url}/rest/v1/avaliacoes?select=nome,nota,comentario,criado_em` +
        `&slug=eq.${encodeURIComponent(slug)}&aprovada=is.true` +
        "&order=criado_em.desc&limit=30",
      {
        headers: { apikey: anon, Authorization: `Bearer ${anon}` },
        // Avaliação nova não precisa aparecer no segundo seguinte, mas também
        // não pode demorar uma hora depois de você aprovar.
        next: { revalidate: 60 },
      },
    );
    if (!r.ok) return [];
    return (await r.json()) as Avaliacao[];
  } catch {
    return [];
  }
}

/** Média e contagem, do jeito que a vitrine precisa. */
export function resumo(lista: Avaliacao[]) {
  if (!lista.length) return null;
  const soma = lista.reduce((t, a) => t + a.nota, 0);
  return {
    nota: Math.round((soma / lista.length) * 10) / 10,
    quantas: lista.length,
  };
}
