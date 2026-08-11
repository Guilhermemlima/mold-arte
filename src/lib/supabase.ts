/**
 * Ponte com o Supabase — o mesmo banco que o Precifica 3D usa.
 *
 * Sem biblioteca: a loja só precisa LER uma coleção pública, e para isso a
 * API REST do Supabase resolve com um `fetch`. Menos uma dependência para
 * manter, e o site continua leve.
 *
 * O que a loja enxerga é apenas `colecao='loja'`: as linhas que o Precifica
 * grava quando você marca "Publicar na loja". Pedidos, rolos de filamento,
 * configurações e clientes ficam de fora pela regra de segurança do banco
 * (arquivo supabase-loja.sql, no projeto do Precifica).
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const owner = process.env.NEXT_PUBLIC_SUPABASE_OWNER;

/** Só consultamos o banco quando as três variáveis estão configuradas. */
export const supabaseConfigurado = Boolean(url && anonKey);

/** Linha da vitrine, exatamente como o Precifica grava. */
export type LinhaVitrine = {
  slug: string;
  nome: string;
  descricao: string;
  categoria: string;
  categoriaSlug: string;
  modo: "apartir" | "unico" | "consulta";
  preco: number;
  tamanhos: { nome: string; preco: number; adicional: number }[];
  /** Leve mais, pague menos: preço por unidade a partir de cada quantidade. */
  faixas?: { qtd: number; preco: number }[];
  foto: string;
  capaCategoria: string;
  universo: string;
  estilo: string;
  caracteristicas: string;
  prazoDias: number;
  estoque: number;
  atualizadoEm: string;
};

type Registro = { id: string; conteudo: LinhaVitrine; atualizado_em: string };

/**
 * Busca os produtos publicados.
 *
 * `revalidate` de 60s: depois de publicar no Precifica, a peça aparece na
 * loja em até um minuto, sem precisar de novo deploy.
 *
 * Devolve `null` (e não uma lista vazia) quando o Supabase não está
 * configurado — assim quem chama sabe a diferença entre "não perguntei" e
 * "perguntei e não há nada", e pode cair no catálogo de demonstração.
 */
export async function buscaVitrine(): Promise<LinhaVitrine[] | null> {
  if (!supabaseConfigurado) return null;

  const params = new URLSearchParams({
    select: "id,conteudo,atualizado_em",
    colecao: "eq.loja",
    apagado: "is.false",
    order: "atualizado_em.desc",
  });

  // Filtra pelo dono quando informado: se um dia outra pessoa usar o mesmo
  // projeto do Supabase, a vitrine continua mostrando só os seus produtos.
  if (owner) params.set("usuario", `eq.${owner}`);

  try {
    const resposta = await fetch(`${url}/rest/v1/dados?${params}`, {
      headers: {
        apikey: anonKey as string,
        Authorization: `Bearer ${anonKey}`,
      },
      next: { revalidate: 60 },
    });

    if (!resposta.ok) {
      console.error(
        `[loja] O Supabase respondeu ${resposta.status} ao listar a vitrine. ` +
          `Se for 401 ou 403, provavelmente falta rodar o supabase-loja.sql.`,
      );
      return [];
    }

    const linhas: Registro[] = await resposta.json();
    return linhas
      .map((linha) => ({ ...linha.conteudo, slug: linha.conteudo?.slug || linha.id }))
      .filter((p) => p.slug && p.nome);
  } catch (erro) {
    console.error("[loja] Não consegui falar com o Supabase:", erro);
    return [];
  }
}
