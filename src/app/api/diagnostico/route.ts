import { NextResponse } from "next/server";

/**
 * Diagnóstico da ligação com o Precifica 3D.
 *
 * Quando a vitrine aparece vazia, a causa está do lado do servidor — e o
 * servidor não tem como contar o que houve para quem está olhando o site.
 * Esta rota abre essa caixa preta: diz se as variáveis chegaram, o que o
 * Supabase respondeu e quantos produtos vieram.
 *
 * Segurança: nunca devolve a chave nem a URL do projeto, só se elas existem.
 * O que ela mostra além disso — quantos produtos estão publicados — já é
 * informação pública, é o que a loja exibe.
 *
 * Pode apagar este arquivo quando a ligação estiver funcionando.
 */

export const dynamic = "force-dynamic";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");
  const chave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const dono = process.env.NEXT_PUBLIC_SUPABASE_OWNER;

  // Formato da chave, sem jamais revelar o conteúdo. Serve para pegar os dois
  // erros mais comuns: colar cortada pela metade, ou colar a chave errada.
  function analisaChave(k?: string) {
    if (!k) return null;
    const limpa = k.trim();
    const info: Record<string, unknown> = {
      tamanho: limpa.length,
      temEspacoOuQuebraDeLinha: /\s/.test(limpa),
      cortadaNoMeio: k !== limpa || limpa.length < 40,
    };
    if (limpa.startsWith("eyJ")) {
      info.formato = "JWT (eyJ...)";
      // O miolo do JWT é público por definição: dá para ler o papel sem
      // validar nada. É assim que descobrimos se veio a chave errada.
      try {
        const meio = JSON.parse(
          Buffer.from(limpa.split(".")[1] || "", "base64").toString("utf8"),
        );
        info.papel = meio.role ?? "(sem papel)";
        info.projeto = meio.ref ?? null;
        info.expirada = meio.exp ? meio.exp * 1000 < Date.now() : null;
      } catch {
        info.papel = "(não consegui ler — chave provavelmente incompleta)";
      }
    } else if (limpa.startsWith("sb_publishable_")) {
      info.formato = "publicável (novo padrão)";
      info.papel = "anon";
    } else if (limpa.startsWith("sb_secret_")) {
      info.formato = "SECRETA — esta chave não pode ficar no site";
      info.papel = "service_role";
    } else {
      info.formato = "desconhecido — não parece uma chave do Supabase";
    }
    return info;
  }

  const base = {
    urlDefinida: Boolean(url),
    chaveDefinida: Boolean(chave),
    chave: analisaChave(chave),
    donoDefinido: Boolean(dono),
    // Só o formato, para checar se veio colado errado — nunca o valor.
    donoPareceUmId: dono
      ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          dono.trim(),
        )
      : null,
    donoTemEspacoOuAspas: dono ? dono !== dono.trim().replace(/^["']|["']$/g, "") : null,
  };

  if (!url || !chave) {
    return NextResponse.json({
      ...base,
      conclusao:
        "Faltam variáveis de ambiente. O site está mostrando o catálogo de demonstração.",
    });
  }

  const cabecalhos = { apikey: chave, Authorization: `Bearer ${chave}` };

  async function consulta(rotulo: string, filtro: string) {
    try {
      const r = await fetch(
        `${url}/rest/v1/dados?select=id,usuario&${filtro}`,
        { headers: cabecalhos, cache: "no-store" },
      );
      const corpo = await r.text();
      let linhas: unknown[] | null = null;
      try {
        const j = JSON.parse(corpo);
        if (Array.isArray(j)) linhas = j;
      } catch {
        /* corpo não é lista: fica no texto do erro */
      }
      return {
        rotulo,
        status: r.status,
        ok: r.ok,
        quantidade: linhas ? linhas.length : null,
        // Só os identificadores, que já são públicos na loja.
        ids: linhas ? (linhas as { id: string }[]).map((l) => l.id).slice(0, 20) : null,
        erro: r.ok ? null : corpo.slice(0, 300),
      };
    } catch (e) {
      return {
        rotulo,
        status: null,
        ok: false,
        quantidade: null,
        ids: null,
        erro: String(e).slice(0, 300),
      };
    }
  }

  // Sem o filtro de dono: mostra tudo que a regra pública deixa ver.
  const semFiltro = await consulta(
    "todos os publicados",
    "colecao=eq.loja&apagado=is.false",
  );

  // Com o filtro: é o que a loja realmente usa hoje.
  const comFiltro = dono
    ? await consulta(
        "publicados do dono configurado",
        `colecao=eq.loja&apagado=is.false&usuario=eq.${encodeURIComponent(dono.trim())}`,
      )
    : null;

  const erroTexto = String(semFiltro.erro ?? "");

  let conclusao: string;
  if (semFiltro.status === 401 && /invalid api key/i.test(erroTexto)) {
    conclusao =
      "A chave em NEXT_PUBLIC_SUPABASE_ANON_KEY não é aceita por este projeto. " +
      "Copie de novo a chave anon/public em Project Settings → API do MESMO projeto da URL, " +
      "cole inteira na Vercel e refaça o deploy. Veja o campo 'chave' acima: se o tamanho " +
      "estiver muito pequeno, ela foi colada cortada.";
  } else if (semFiltro.status === 401 || semFiltro.status === 403) {
    conclusao =
      "A chave foi aceita, mas a leitura foi barrada pelas regras do banco. " +
      "É o supabase-loja.sql que ainda não foi rodado, ou a política de leitura pública que não foi criada.";
  } else if (!semFiltro.ok) {
    conclusao = `O Supabase respondeu ${semFiltro.status}. Veja o campo 'erro' acima.`;
  } else if ((semFiltro.quantidade ?? 0) === 0) {
    conclusao =
      "A leitura funciona, mas não há nenhum produto publicado no banco. Publique uma peça no Precifica e confirme que a nuvem sincronizou.";
  } else if (comFiltro && (comFiltro.quantidade ?? 0) === 0) {
    conclusao =
      "Existem produtos publicados, mas nenhum pertence ao identificador configurado em NEXT_PUBLIC_SUPABASE_OWNER. Corrija essa variável (ou apague ela) e refaça o deploy.";
  } else {
    conclusao = "Está tudo certo: a loja deveria estar mostrando esses produtos.";
  }

  return NextResponse.json({ ...base, semFiltro, comFiltro, conclusao });
}
