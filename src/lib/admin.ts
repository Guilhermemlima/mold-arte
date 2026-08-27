import "server-only";

/**
 * Acesso administrativo ao Supabase.
 *
 * A chave `service_role` ignora todas as regras de segurança do banco. Ela
 * nunca pode ganhar o prefixo NEXT_PUBLIC_ nem ser importada por componente de
 * tela — o `server-only` lá em cima faz o build quebrar se alguém tentar, em
 * vez de a chave vazar silenciosamente para o navegador.
 */

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");
export const chaveServico = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const dono = process.env.NEXT_PUBLIC_SUPABASE_OWNER;

export const bancoConfigurado = Boolean(supabaseUrl && chaveServico && dono);

function cabecalhos(extras: Record<string, string> = {}) {
  return {
    apikey: chaveServico as string,
    Authorization: `Bearer ${chaveServico}`,
    "Content-Type": "application/json",
    ...extras,
  };
}

/** Insere uma linha e devolve o que o banco gravou. */
export async function insere<T>(
  tabela: string,
  linha: Record<string, unknown>,
): Promise<{ ok: true; dados: T } | { ok: false; erro: string }> {
  if (!bancoConfigurado) return { ok: false, erro: "banco não configurado" };

  try {
    const r = await fetch(`${supabaseUrl}/rest/v1/${tabela}`, {
      method: "POST",
      headers: cabecalhos({ Prefer: "return=representation" }),
      cache: "no-store",
      body: JSON.stringify(linha),
      signal: AbortSignal.timeout(10000),
    });

    const texto = await r.text();
    if (!r.ok) {
      console.error(`[admin] ${tabela} recusou (${r.status}): ${texto}`);
      return { ok: false, erro: texto.slice(0, 200) };
    }

    const lista = JSON.parse(texto) as T[];
    return { ok: true, dados: lista[0] };
  } catch (e) {
    console.error(`[admin] ${tabela} falhou:`, e);
    return { ok: false, erro: "não consegui falar com o banco" };
  }
}

/* ==========================================================================
   Arquivos
   ========================================================================== */

/**
 * Autorização para o navegador subir um arquivo direto no Storage.
 *
 * O arquivo **não passa por aqui**. A Vercel corta requisição acima de uns
 * 4,5 MB, e um STL de peça grande passa fácil disso — se o upload viesse pelo
 * servidor, o formulário quebraria justamente nos projetos que mais importam.
 * Então o servidor só assina a permissão, válida por poucos minutos e para um
 * caminho só, e o navegador entrega o arquivo direto ao Supabase.
 */
export async function autorizaUpload(
  caminho: string,
): Promise<{ ok: true; url: string } | { ok: false; erro: string }> {
  if (!bancoConfigurado) return { ok: false, erro: "banco não configurado" };

  try {
    const r = await fetch(
      `${supabaseUrl}/storage/v1/object/upload/sign/orcamentos/${caminho}`,
      {
        method: "POST",
        headers: cabecalhos(),
        cache: "no-store",
        body: JSON.stringify({ expiresIn: 600 }),
        signal: AbortSignal.timeout(10000),
      },
    );

    const texto = await r.text();
    if (!r.ok) {
      console.error(`[admin] storage recusou assinar (${r.status}): ${texto}`);
      return { ok: false, erro: "não consegui liberar o envio do arquivo" };
    }

    // Vem como "/object/upload/sign/orcamentos/<caminho>?token=..."
    const { url } = JSON.parse(texto) as { url: string };
    return { ok: true, url: `${supabaseUrl}/storage/v1${url}` };
  } catch (e) {
    console.error("[admin] falhou ao assinar upload:", e);
    return { ok: false, erro: "não consegui liberar o envio do arquivo" };
  }
}

/**
 * Link temporário de download.
 *
 * O balde é privado: o STL do cliente é o projeto dele, não uma vitrine. O
 * link vence, então ele serve para o e-mail de aviso sem virar um endereço
 * público permanente.
 */
export async function linkTemporario(
  caminho: string,
  segundos = 60 * 60 * 24 * 7,
): Promise<string | null> {
  if (!bancoConfigurado) return null;

  try {
    const r = await fetch(
      `${supabaseUrl}/storage/v1/object/sign/orcamentos/${caminho}`,
      {
        method: "POST",
        headers: cabecalhos(),
        cache: "no-store",
        body: JSON.stringify({ expiresIn: segundos }),
        signal: AbortSignal.timeout(10000),
      },
    );
    if (!r.ok) return null;

    const { signedURL } = (await r.json()) as { signedURL: string };
    // download=1 faz o arquivo baixar em vez de abrir na aba. Importa
    // para SVG, que o navegador trata como documento e executa script
    // de dentro: um logo mal-intencionado rodaria no seu navegador, no
    // domínio do Supabase, com você logado. Baixado, ele é só um arquivo.
    return `${supabaseUrl}/storage/v1${signedURL}&download=1`;
  } catch {
    return null;
  }
}
