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
  tamanhos: { nome: string; preco: number; adicional: number; pesoGramas?: number }[];
  /**
   * Peso da peça em gramas, sem embalagem.
   *
   * Vem do Precifica, que já sabe quantos gramas de filamento a peça leva.
   * Ausente nas peças publicadas antes disso existir — nesse caso a loja usa
   * o peso padrão de `site.ts`, para o frete não sair do bolso calado.
   */
  pesoGramas?: number;
  /** Leve mais, pague menos: preço por unidade a partir de cada quantidade. */
  faixas?: { qtd: number; preco: number }[];
  foto: string;
  /** Galeria completa, principal primeiro. Vazio nos produtos publicados
   *  antes da galeria existir — aí vale só `foto`. */
  fotos?: string[];
  capaCategoria: string;
  universo: string;
  estilo: string;
  caracteristicas: string;
  prazoDias: number;
  /** Quantidade publicada — é a base da conta, não o disponível de agora. */
  estoque: number;
  /** Desde quando essa base vale; as vendas depois disso são descontadas. */
  estoqueDefinidoEm?: string;
  atualizadoEm?: string;
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
      // Rede de segurança: o Precifica avisa a loja assim que publica algo
      // (rota /api/revalidar), e é esse aviso que faz a mudança aparecer na
      // hora. Este prazo cobre o caso de o aviso não chegar.
      next: { revalidate: 30 },
    });

    if (!resposta.ok) {
      console.error(
        `[loja] O Supabase respondeu ${resposta.status} ao listar a vitrine. ` +
          `Se for 401 ou 403, provavelmente falta rodar o supabase-loja.sql.`,
      );
      return [];
    }

    const linhas: Registro[] = await resposta.json();
    const produtos = linhas
      .map((linha) => ({ ...linha.conteudo, slug: linha.conteudo?.slug || linha.id }))
      .filter((p) => p.slug && p.nome);

    // A quantidade publicada é só a base. O disponível de verdade desconta o
    // que já foi vendido, e é o banco que sabe disso.
    const disponivel = await buscaEstoque();
    if (!disponivel) return produtos;

    return produtos.map((p) =>
      disponivel.has(p.slug) ? { ...p, estoque: disponivel.get(p.slug) as number } : p,
    );
  } catch (erro) {
    console.error("[loja] Não consegui falar com o Supabase:", erro);
    return [];
  }
}

/**
 * Quantidade realmente disponível de cada peça.
 *
 * Sai de uma função no banco que soma a base publicada com as vendas
 * registradas depois dela. Cache curto de propósito: preço pode ficar um
 * minuto desatualizado sem prejuízo, estoque não — é o que separa "vendi"
 * de "vendi duas vezes".
 *
 * Devolve `null` quando não dá para consultar; nesse caso a loja continua
 * com a quantidade publicada, que é melhor do que travar a venda.
 */
async function buscaEstoque(): Promise<Map<string, number> | null> {
  if (!owner) return null;

  try {
    const r = await fetch(`${url}/rest/v1/rpc/estoque_disponivel`, {
      method: "POST",
      headers: {
        apikey: anonKey as string,
        Authorization: `Bearer ${anonKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ p_usuario: owner }),
      next: { revalidate: 15 },
    });

    if (!r.ok) {
      console.error(
        `[loja] Não consegui ler o estoque (${r.status}). ` +
          `Se for 404, falta rodar o supabase-estoque.sql.`,
      );
      return null;
    }

    const linhas: { slug: string; disponivel: number }[] = await r.json();
    return new Map(linhas.map((l) => [l.slug, l.disponivel]));
  } catch {
    return null;
  }
}
